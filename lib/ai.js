import { AI_PROXY_URL, AI_PROXY_TOKEN, AI_PROXY_CONFIGURED } from './aiConfig';

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
