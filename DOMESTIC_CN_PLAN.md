# WanderNote Domestic CN Ads MVP Plan

## 1. Product Positioning

Domestic CN version is a China-focused travel memory and AI travel content app.

It is separate from the global WanderNote App Store version.

Global version:
- International users
- App Store / TestFlight
- Instagram / TikTok / WhatsApp style outputs
- Global AI provider
- iPhone-first

Domestic CN version:
- Mainland China users
- Chinese-first UI
- WeChat Moments / Xiaohongshu / Douyin / group chat sharing outputs
- Domestic AI provider
- Rewarded ads as a monetization experiment
- iPhone-first first; no iPad in this phase

## 2. Core Rule

Do not pollute the global main branch.

All domestic CN experiments must stay on:

domestic-cn-ads-mvp

## 3. Monetization Strategy

Do not use disruptive ads first.

Avoid:
- Splash ads
- Banner ads on home screen
- Forced interstitial ads
- Ads before every core action

Preferred:
- Rewarded ads
- User voluntarily watches an ad to unlock a valuable result

Rewarded ad use cases:
- Watch ad to generate one AI itinerary
- Watch ad to generate one Trip Capsule
- Watch ad to generate one Xiaohongshu-style post
- Watch ad to export one travel memory card
- Watch ad to unlock one advanced packing/checklist template

## 4. Free Usage Model

Initial domestic MVP model:

- Daily free AI itinerary: 1
- Daily rewarded-ad AI unlocks: 3 max
- Daily Trip Capsule free generation: 0 or 1
- Rewarded ad unlock required after free quota
- Hard cap to prevent AI cost abuse

No unlimited ad-to-AI loop.

## 5. AI Provider Strategy

Do not use Gemini as the long-term domestic production model.

Domestic provider candidates:
- DeepSeek
- Tongyi Qianwen
- Doubao
- Zhipu AI
- Tencent Hunyuan
- Baidu ERNIE

Preferred architecture:
App -> AI proxy -> provider router

Provider routing:
- global -> Gemini or global provider
- cn -> domestic provider

The App should not directly care which AI model is used.

## 6. Advertising Architecture

Phase 0:
Mock rewarded ads only.

No real ad SDK yet.

Create an abstraction later:

lib/ads.js

showRewardedAd(reason)

Business code only checks:

if rewarded, continue action.

Phase 1:
Integrate one real rewarded ad SDK only.

Candidate SDKs:
- Pangle / 穿山甲 / GroMore
- Tencent 优量汇

Do not integrate multiple ad networks at the same time.

## 7. Domestic Social Output Types

Global output types:
- Instagram Caption
- TikTok / Reels Script
- WhatsApp Message
- Travel Journal
- Memory Summary

Domestic output types:
- 朋友圈文案
- 小红书笔记
- 抖音短视频脚本
- 微信群分享文案
- 旅行总结长图
- 九宫格配文

Important:
Do not show Xiaohongshu / WeChat-specific labels in non-Chinese global UI.

Use shared internal output types:
- social_caption
- short_video_script
- memory_summary
- travel_journal
- trip_card_export

Then localize labels by region/language.

## 8. Compliance Checklist

Before real domestic release, check:

- App ICP / app filing requirement
- Privacy policy in Chinese
- SDK list disclosure
- AI provider disclosure
- Ad SDK data collection disclosure
- Photo permission explanation
- Location permission explanation
- Account deletion path
- Data deletion request path
- AI generated content disclaimer

Do not ship a public domestic release without these.

## 9. Not In Scope For Domestic Ads MVP

Do not do now:

- iPad support
- Real subscription system
- RevenueCat China setup
- Multiple ad SDKs
- WeChat SDK
- Community/social network
- Public content feed
- Avatar cloud sync
- Annual report
- Complex backend migration
- Domestic app store release

## 10. First Domestic MVP Goal

Validate this question:

Will Chinese travel users accept a free travel memory app where valuable AI outputs are unlocked by rewarded ads?

Success signals:
- Users generate AI itineraries repeatedly
- Users use domestic social output templates
- Users voluntarily watch rewarded ads
- Users copy/share generated content
- Users create more than one trip
- Users return after a trip to generate a summary

Failure signals:
- Users ignore AI outputs
- Users refuse rewarded ads
- Users abandon during login
- Users only test once and never return
- AI cost exceeds ad value

## 11. Development Phases

v0.1:
- Product rules document
- Mock ad service
- CN feature flags
- Domestic output labels
- No real ad SDK

v0.2:
- Rewarded ad UI flow
- AI quota logic
- Mock unlocks
- Domestic AI provider abstraction

v0.3:
- Integrate one rewarded ad SDK
- Add privacy disclosure
- Test fill rate and user behavior

v0.4:
- Domestic social output templates
- Trip Capsule CN version
- Export/copy flows

