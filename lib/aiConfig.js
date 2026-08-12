// AI 代理配置。
//
// 之前 AI 走的是 Supabase edge function，而免费版 Supabase 项目闲置 7 天会自动暂停，
// 一暂停就把登录、同步、AI 一起带走 —— 2026 年 6 月被 App Review 以 2.1(a) 拒绝就是
// 因为这个。现在 AI 走 Cloudflare Workers（不休眠），Supabase 只负责可选的账号同步。
//
// 部署步骤见 workers/ai-proxy/README.md。部署完把 wrangler 打印的地址填到这里。

export const AI_PROXY_URL = 'https://wandernote-ai-proxy.REPLACE-ME.workers.dev';

// 与 worker 上 `wrangler secret put APP_TOKEN` 设置的值保持一致。
// 这个值会打进 app 包里，只是挡一下随手抓取，不是真正的鉴权。
export const AI_PROXY_TOKEN = 'REPLACE-ME';

export const AI_PROXY_CONFIGURED =
  !AI_PROXY_URL.includes('REPLACE-ME') && !AI_PROXY_TOKEN.includes('REPLACE-ME');
