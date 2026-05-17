# 旅迹 Domestic AI Cost Control Plan

## Goal

Domestic version should encourage frequent AI usage, but AI usage must be cost-controlled.

Core idea:

Free quota + rewarded ads + hard daily limits + future server-side tracking.

Do not rely on temporary free AI credits as the long-term business model.

## Product Rule

Do not offer unlimited AI generation.

Even if a provider gives high free credits, treat it as temporary testing credit only.

Production usage must assume every AI request has real cost.

## Initial AI Usage Model

### AI Itinerary

Task:

AI 路书

Initial quota:

- Free: 1 per user per day
- Rewarded ad unlock: 3 per user per day
- Hard daily max: 4 per user per day

### Social Copy

Tasks:

- 朋友圈文案
- 小红书笔记
- 微信群分享文案

Initial quota:

- Free: 2 per user per day
- Rewarded ad unlock: 5 per user per day
- Hard daily max: 7 per user per day

### Short Video Script

Task:

抖音短视频脚本

Initial quota:

- Free: 1 per user per day
- Rewarded ad unlock: 3 per user per day
- Hard daily max: 4 per user per day

### Trip Capsule

Task:

旅迹胶囊

Initial quota:

- Free: 0 or 1 per user per day
- Rewarded ad unlock: 1 per user per day
- Hard daily max: 1 or 2 per user per day

Reason:

Trip Capsule may use more context and more tokens. It should not be unlimited.

## Token Budget

Use different token budgets by task.

### Itinerary

Max output tokens:

3000-5000

Reason:

Itinerary needs structure but should stay concise.

### Social Copy

Max output tokens:

800-1200

Reason:

Short copy should be cheap and fast.

### Xiaohongshu-style Note

Max output tokens:

1200-1800

Reason:

Longer than social copy, but should not become an essay.

### Douyin Script

Max output tokens:

1000-1500

Reason:

Needs hook, shot list, voiceover, caption, hashtags.

### Trip Capsule

Max output tokens:

1500-2500

Reason:

Should be structured and reusable, not too long.

## Cost Tracking Event

Every AI call should eventually produce one usage event.

Suggested event shape:

{
  "id": "uuid",
  "userId": "user id",
  "task": "itinerary | social_caption | xiaohongshu_note | short_video_script | trip_capsule",
  "provider": "gemini | deepseek | qwen | zhipu | doubao",
  "model": "model name",
  "source": "free | rewarded_ad | paid",
  "region": "global | cn",
  "inputTokens": 0,
  "outputTokens": 0,
  "estimatedCost": 0,
  "success": true,
  "error": null,
  "createdAt": "iso timestamp"
}

## v0.1 Local Tracking

Current implementation:

- AsyncStorage quota only
- No server-side cost tracking
- No provider token accounting
- Acceptable for internal MVP only

Files:

- lib/aiQuota.js
- lib/domesticAiAccess.js
- lib/ads.js

## v0.2 Provider Routing

Current direction:

- App sends region/task
- claude-proxy chooses provider
- Gemini remains default
- DeepSeek skeleton exists
- No client API key exposure

## v0.3 Server-Side Quota

Before public domestic release, move quota from local AsyncStorage to server-side storage.

Reason:

Local quota can be bypassed by:
- deleting app
- reinstalling app
- clearing local storage
- switching devices

Server-side quota should key by:

- user_id
- date
- task
- source

## v0.4 Cost Dashboard

Before real ad monetization, create a minimal cost dashboard.

Must answer:

- How many AI calls per day?
- Which task is most used?
- Which provider is cheapest?
- Which provider has best JSON stability?
- How many calls are free?
- How many calls are rewarded-ad unlocked?
- Does ad value cover AI cost?
- What is average cost per user per day?

## Rewarded Ad Economics

Rewarded ads should unlock valuable AI results.

Good unlocks:

- One AI itinerary
- One Xiaohongshu-style note
- One Douyin script
- One Trip Capsule
- One travel card export

Bad unlocks:

- Random banner exposure
- Forced splash ads
- Forced interstitial before basic navigation
- Unlimited AI after one ad

## Hard Rules

Do not:

- Allow unlimited ad-to-AI usage
- Depend on temporary AI free credits
- Put AI keys in the client
- Add real ad SDK before AI cost is understood
- Add multiple AI providers before one provider is measured
- Increase maxTokens without cost review
- Publicly release domestic AI without server-side quota

## Initial Success Criteria

Domestic AI monetization experiment is promising if:

- Users voluntarily watch rewarded ads
- AI usage increases without cost explosion
- AI itinerary JSON remains stable
- Copy/share rate increases
- Users generate multiple outputs across multiple days
- Average AI cost per active user remains controlled

## Failure Signals

Stop or redesign if:

- Users ignore rewarded ads
- AI generation cost exceeds expected ad value
- DeepSeek/Qwen JSON output is unstable
- Users generate once and never return
- Long outputs become expensive but not shared
- Quota bypass becomes obvious
