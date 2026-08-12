/**
 * WanderNote AI proxy on Cloudflare Workers.
 *
 * Replaces the Supabase edge function `claude-proxy`. Supabase free-tier projects
 * pause after ~7 days idle, which took the whole AI feature down between releases
 * and is what App Review hit in June. Workers have no such idle pause.
 *
 * Request:  POST { prompt, maxTokens?, responseMimeType? }
 * Response: { content: [{ type: 'text', text }] }   (same shape the app already parses)
 */

const GEMINI_MODEL = 'gemini-2.5-flash';
const UPSTREAM_TIMEOUT_MS = 40000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-app-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/**
 * Turn a Gemini response into text, or into an error we can actually act on.
 * The old proxy collapsed every one of these cases into "Empty AI response",
 * which made real failures indistinguishable from a truncated answer.
 */
function extractText(data) {
  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) {
    return { error: `Request was blocked upstream (${blockReason}).` };
  }

  const candidate = data?.candidates?.[0];
  if (!candidate) {
    return { error: 'AI returned no candidates.' };
  }

  const text = (candidate.content?.parts ?? [])
    .map(part => part?.text ?? '')
    .join('')
    .trim();

  if (text) return { text };

  // Empty parts with MAX_TOKENS means the budget was spent before any text was
  // emitted — a distinct, retryable condition, not a generic empty response.
  const finish = candidate.finishReason;
  if (finish === 'MAX_TOKENS') {
    return { error: 'AI response hit the token limit before producing text.' };
  }
  if (finish === 'SAFETY' || finish === 'RECITATION') {
    return { error: `AI stopped early (${finish}).` };
  }
  return { error: 'AI returned an empty response.' };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    // Shared token so this is not a wide-open Gemini relay. The app ships it, so
    // it is a speed bump against scraping rather than real authentication.
    if (env.APP_TOKEN && request.headers.get('x-app-token') !== env.APP_TOKEN) {
      return json({ error: 'Unauthorized' }, 401);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: 'AI service is not configured' }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const prompt = String(body?.prompt ?? '').trim();
    if (!prompt) {
      return json({ error: 'Missing prompt' }, 400);
    }
    if (prompt.length > 20000) {
      return json({ error: 'Prompt too long' }, 413);
    }

    const maxTokens = Math.min(Math.max(Number(body?.maxTokens) || 4096, 1024), 12000);

    const generationConfig = {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 0 },
    };
    if (body?.responseMimeType) {
      generationConfig.responseMimeType = String(body.responseMimeType);
    }

    // Travel writing kept tripping the default thresholds (food, nightlife,
    // regional history), so only block the high-confidence cases.
    const safetySettings = [
      'HARM_CATEGORY_HARASSMENT',
      'HARM_CATEGORY_HATE_SPEECH',
      'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      'HARM_CATEGORY_DANGEROUS_CONTENT',
    ].map(category => ({ category, threshold: 'BLOCK_ONLY_HIGH' }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    let upstream;
    try {
      upstream = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig,
          safetySettings,
        }),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
    } catch (e) {
      const timedOut = e?.name === 'TimeoutError' || e?.name === 'AbortError';
      return json(
        { error: timedOut ? 'AI request timed out.' : 'Could not reach the AI service.' },
        504
      );
    }

    let data;
    try {
      data = await upstream.json();
    } catch {
      return json({ error: 'AI service returned an unreadable response.' }, 502);
    }

    if (!upstream.ok) {
      return json(
        { error: data?.error?.message || `AI request failed (${upstream.status}).` },
        upstream.status === 429 ? 429 : 502
      );
    }

    const result = extractText(data);
    if (result.error) {
      return json({ error: result.error }, 502);
    }

    return json({ content: [{ type: 'text', text: result.text }] });
  },
};
