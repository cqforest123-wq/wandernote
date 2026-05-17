# Travel Publish Assistant App Plan

## Working Name

旅行发布助手

## Product Decision

This should become a separate new app.

It should not remain only as a domestic branch or feature module inside WanderNote.

## Why Split From WanderNote

WanderNote direction:

- Travel records
- Itinerary
- Trip memory
- Packing checklist
- Map / trip organization
- Long-term travel archive

Travel Publish Assistant direction:

- Travel photos/videos/records
- Platform-specific publishing packages
- Faster content creation
- Copy/export for social platforms
- Publishing efficiency

These are different product routes.

Combining them will make WanderNote too broad and unfocused.

## One Sentence Positioning

把旅行照片、视频和记录，快速变成适合朋友圈、小红书、抖音发布的内容包。

## Core User Need

The user does not primarily want "AI text".

The user wants:

我拍了很多旅行照片和视频，但不知道怎么整理、怎么写标题、怎么剪、怎么发。

## MVP Core Flow

1. Select or describe travel material
2. Choose publishing platform
3. Choose expression style
4. Generate publish package
5. Copy / save / manually publish

## Initial Platforms

### WeChat Moments

Use case:

- Familiar social circle
- Short emotional travel copy
- Personal and relaxed

Output:

- Short caption
- Optional emoji
- Optional photo order suggestion

### Xiaohongshu

Use case:

- Travel note
- Searchable recommendation
- Experience + useful tips

Output:

- Title options
- Opening paragraph
- Structured note
- Highlights
- Tips
- Hashtags

### Douyin

Use case:

- Short travel video publishing
- Need structure, hook, subtitles, cover title

Output:

- 3-second hooks
- 15-second video structure
- 30-second video structure
- Shot order
- Voiceover
- Screen captions
- Cover titles
- Post titles
- Hashtags
- Editing suggestion

## Initial Styles

- 松弛治愈
- 高级冷感
- 实用攻略
- 震撼风景
- 亲子家庭
- 公路旅行
- 城市漫游
- 海岛度假

## i18n Rule

Important lesson from WanderNote:

Do not hardcode Chinese UI text into components.

The first product version can focus only on Chinese domestic publishing scenarios, but the codebase must be i18n-ready from day one.

Rules:

- All UI copy must go through i18n keys.
- Platform labels must come from config, not scattered JSX strings.
- Prompt templates must be separated by locale and platform.
- Domestic prompt files can start with zh-CN only.
- Future international version should add en-US configs/prompts without rewriting screens.
- Do not repeat WanderNote's painful late-stage globalization problem.

## Architecture Rule

Product scope is Chinese-first.

Engineering architecture is international-ready.

This means:

- No early English product launch
- No early international platform support
- But no hardcoded Chinese strings inside screens
- No screen-level prompt spaghetti
- Use config-driven platforms and styles

## Suggested Project Path

/Users/litao/travel-publish-assistant

## Suggested GitHub Repository

travel-publish-assistant

## Suggested Stack

- Expo
- React Native
- TypeScript preferred if setup is manageable
- expo-router preferred for clean navigation
- i18n from day one
- mock data first
- no backend in v0.1

## v0.1 Scope

Do:

- Home screen
- Material input mock screen
- Platform selection
- Style selection
- Result screen
- Mock publish package generation
- Copy result

Do not:

- Real AI provider
- Real ad SDK
- Login
- Cloud storage
- Supabase
- RevenueCat
- Direct publishing to social platforms
- Real photo/video AI analysis
- PS-style retouching

## v0.1 Input Model

Use simple manual/material context:

- destination
- travel date
- material type: photos / videos / mixed
- material count
- optional user note
- selected platform
- selected style

This avoids heavy image/video understanding in the first version.

## v0.2 Scope

- Select photos/videos from local device
- Show selected material preview
- Still do not perform heavy visual AI analysis
- Generate publish package based on user note + metadata

## v0.3 Scope

- Connect AI provider
- Track generation count
- Add cost control
- Add local quota
- Consider rewarded ad mock

## v0.4 Scope

- Real rewarded ad SDK only after usage is proven
- Server-side quota
- Cost tracking
- Provider routing

## Do Not Build Early

Do not build early:

- AI video editing
- Automatic cutting
- Face retouching
- Remove passerby
- Sky replacement
- One-click viral video promise
- Direct auto-posting to WeChat/Xiaohongshu/Douyin

## International Derivative Later

Possible future international version:

- Instagram Caption
- Instagram Reel Pack
- TikTok Travel Video Pack
- YouTube Shorts Pack
- WhatsApp Family Update

But do not build this in v0.1.

International derivative should reuse:

- platform config
- style config
- prompt architecture
- result rendering

## Success Criteria

The new app direction is promising if:

- Users can generate usable output in under 30 seconds.
- Users copy results.
- Users try more than one platform for the same trip material.
- Douyin output helps organize video structure, not just text.
- Xiaohongshu output has useful structure.
- WeChat Moments output feels natural and personal.
- The workflow feels faster than thinking from scratch.

## Failure Signals

Redesign if:

- Users only try once.
- Output feels generic.
- The app feels like another AI text toy.
- Users cannot tell the difference between platform outputs.
- Material input feels burdensome.
- Result is not copy-ready.
