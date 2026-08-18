import { AI_PROXY_URL, AI_PROXY_TOKEN, AI_PROXY_CONFIGURED } from './aiConfig';
import { logEvent } from './diagnostics';

const REQUEST_TIMEOUT_MS = 45000;

/**
 * 调用 AI 代理生成文本。
 *
 * 调用方（AIScreen / MemoScreen）都会在抛错时退回到 lib/travelStoryFallback.js 的
 * 本机生成，所以这里保持"失败就抛"的语义，不要吞掉错误。
 */
export async function callAI(prompt, maxTokens = 1000, options = {}) {
  if (!prompt || !String(prompt).trim()) {
    throw new Error('Empty prompt');
  }

  if (!AI_PROXY_CONFIGURED) {
    throw new Error('AI proxy is not configured');
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-token': AI_PROXY_TOKEN,
      },
      body: JSON.stringify({
        prompt,
        maxTokens,
        responseMimeType: options.responseMimeType,
        responseSchema: options.responseSchema,
        // A label so the proxy's metrics can separate the features.
        feature: options.feature,
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      logEvent('ai', 'http-error', { status: res.status });
      throw new Error(data?.error || `AI request failed with status ${res.status}`);
    }

    const text = data?.content?.[0]?.text || '';

    if (!text) {
      logEvent('ai', 'empty-response', {});
      throw new Error(data?.error || 'Empty AI response');
    }

    logEvent('ai', 'ok', { ms: Date.now() - startedAt, chars: text.length });

    return text;
  } catch (e) {
    if (e?.name === 'AbortError') {
      logEvent('ai', 'timeout', { ms: Date.now() - startedAt });
      throw new Error('AI request timed out. Please try again.');
    }

    // A bare TypeError from fetch means the host could not be reached at all,
    // which is what *.workers.dev looks like from mainland China. Recording
    // the shape of the failure separates "blocked" from "server said no".
    logEvent('ai', 'failed', {
      kind: e?.name || 'Error',
      ms: Date.now() - startedAt,
      message: String(e?.message || e).slice(0, 60),
    });
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
