# WanderNote Domestic AI Provider Plan

## Goal

Domestic CN version should not depend on Gemini as the long-term production AI provider.

The App should not directly care which AI model is used.

Target architecture:

App
-> AI proxy
-> provider router
-> domestic AI provider

## Current Global Flow

Current global flow:

App
-> lib/claude.js
-> Supabase Edge Function: claude-proxy
-> Gemini API

This works for global beta.

Do not break the global flow.

## Domestic Target Flow

Domestic CN target flow:

App
-> lib/claude.js or future lib/ai.js
-> AI proxy
-> provider router
-> DeepSeek / Qwen / GLM / Doubao / Hunyuan

Provider should be selected server-side.

## Provider Candidates

### 1. DeepSeek

Pros:
- OpenAI-compatible API
- Simple integration
- Good Chinese capability
- Good cost-performance

Recommended for first domestic prototype.

### 2. Alibaba Qwen / Bailian

Pros:
- Strong China cloud ecosystem
- OpenAI-compatible API available
- Better enterprise/compliance path

Recommended for more formal China deployment.

### 3. Zhipu GLM

Pros:
- OpenAI-compatible API
- Strong Chinese model ecosystem

Good backup provider.

### 4. Doubao / Volcano Ark

Pros:
- Strong consumer/content ecosystem
- Suitable for Chinese content generation

Good later candidate.

### 5. Tencent Hunyuan

Pros:
- Tencent ecosystem
- Potential fit if WeChat/Tencent ads become important later

Later candidate.

## Provider Selection Rule

Do not hardcode provider in the App.

Bad:

App directly calls DeepSeek.

Good:

App calls AI proxy.
AI proxy decides:

provider = global -> Gemini
provider = cn -> DeepSeek or Qwen

## Suggested Request Shape

App sends:

{
  "prompt": "...",
  "maxTokens": 1200,
  "responseMimeType": "application/json",
  "region": "cn",
  "task": "itinerary"
}

Server decides:

- region = global -> Gemini
- region = cn -> domestic provider
- task = itinerary -> structured JSON prompt
- task = social_output -> text or JSON
- task = trip_capsule -> JSON

## Domestic Provider Environment Variables

Future Supabase / backend secrets:

AI_PROVIDER_GLOBAL=gemini
AI_PROVIDER_CN=deepseek

GEMINI_API_KEY=...
DEEPSEEK_API_KEY=...
QWEN_API_KEY=...
ZHIPU_API_KEY=...

Do not expose these keys in the App.

## Cost Control

Domestic AI must have cost controls:

- Daily free quota
- Rewarded ad unlock quota
- maxTokens per task
- retry limit
- request timeout
- user-level rate limit
- server-side quota before public release

Local AsyncStorage quota is only acceptable for v0.1 mock validation.

## Task Routing

Domestic AI tasks:

1. itinerary
   - AI 路书
   - JSON output
   - strict schema

2. trip_capsule
   - 旅迹胶囊
   - JSON output
   - title / oneLine / highlights / summary / socialText

3. social_caption
   - 朋友圈文案
   - 小红书笔记
   - 微信群分享文案

4. short_video_script
   - 抖音短视频脚本
   - hook / shots / voiceover / caption / hashtags

5. memory_summary
   - 旅途回忆
   - personal archive style

## First Implementation Recommendation

Phase v0.2:

- Keep current App API stable.
- Add provider router in Edge Function or backend.
- First domestic provider: DeepSeek.
- Only route itinerary task first.
- Do not route all AI tasks at once.

## Do Not Do Yet

Do not:
- Put DeepSeek API key in App.
- Add multiple AI providers at once.
- Add real ad SDK and AI provider in the same commit.
- Change global Gemini flow without tests.
- Increase token limits before cost testing.
- Publicly release domestic AI without compliance review.

## Acceptance Criteria

v0.2 AI provider router passes if:

- Global build still uses existing Gemini flow.
- Domestic branch can request cn provider through proxy.
- DeepSeek or Qwen can generate itinerary JSON.
- Existing parseAiJsonObject still works.
- Failure is handled gracefully.
- No API key is exposed in client bundle.
