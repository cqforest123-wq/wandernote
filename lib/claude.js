import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

export async function callClaude(prompt, maxTokens = 1000, options = {}) {
  if (!prompt || !String(prompt).trim()) {
    throw new Error('Empty prompt');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/claude-proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        maxTokens,
        responseMimeType: options.responseMimeType,
        region: options.region,
        task: options.task,
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || `AI request failed with status ${res.status}`);
    }

    const text = data?.content?.[0]?.text || '';

    if (!text) {
      throw new Error(data?.error || 'Empty AI response');
    }

    return text;
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new Error('AI request timed out. Please try again.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
