# 旅迹 Domestic Content Publish Flow

## Goal

Domestic version should evolve from simple AI copy generation into a travel content publishing assistant.

The core user need is not:

"Generate text."

The real user need is:

"I have travel photos/videos. Help me quickly turn them into something I can post."

## Product Direction

Future domestic content flow:

Travel record
-> Select photos/videos
-> Select platform
-> Select style
-> Generate publish package
-> Copy / export / post manually

## Why This Matters

A simple AI text button may have limited usage.

Users are more likely to use the feature when it starts from their real behavior:

- I just traveled somewhere
- I took photos and videos
- I want to post, but I don't know how to organize it
- I don't want to spend 30 minutes thinking of captions, titles, shot order, and hashtags

## Platform Layer

The user first chooses where they want to publish.

Initial platforms:

### 1. WeChat Moments

Use case:
- Familiar social circle
- Short emotional copy
- Personal, relaxed, low pressure

Output:
- Short caption
- Optional emoji
- Optional photo order suggestion

### 2. Xiaohongshu

Use case:
- Searchable travel note
- Experience + useful information
- More structured than Moments

Output:
- Title options
- Opening paragraph
- Main note
- Highlights
- Tips / avoid-pit notes
- Hashtags

### 3. Douyin

Use case:
- Short video publishing
- Needs hook, shot order, subtitles, cover title

Output:
- 3-second hooks
- 15s / 30s video structure
- Shot order
- Voiceover
- Screen captions
- Cover titles
- Post titles
- Hashtags
- Editing style suggestion

## Style Layer

After platform selection, user chooses expression style.

Initial styles:

### 1. 松弛治愈

Use for:
- Slow travel
- Nature
- Beach
- City walk
- Relaxed family trips

Tone:
- Soft
- Calm
- Emotional but not exaggerated

### 2. 高级冷感

Use for:
- Iceland
- Nordic countries
- Snow mountains
- Architecture
- Minimalist scenes

Tone:
- Sparse
- Clean
- Visual
- Not overly emotional

### 3. 实用攻略

Use for:
- Xiaohongshu
- Travel planning
- Route summary
- First-time visitors

Tone:
- Clear
- Useful
- Specific
- Avoid fake details

### 4. 震撼风景

Use for:
- Iceland
- Alaska
- Yellowstone
- National parks
- Deserts / volcanoes / glaciers

Tone:
- Spacious
- Strong visual sense
- Still avoid exaggerated clickbait

### 5. 亲子家庭

Use for:
- Family travel
- Child-friendly route
- Comfortable travel memory

Tone:
- Warm
- Real
- Not overly sentimental

### 6. 公路旅行

Use for:
- Road trips
- Self-driving
- Scenic roads

Tone:
- Free
- Moving
- Route-based

## Material Layer

v0.1 material input:

Use existing trip/day data only:

- destination
- date
- memos
- photo count
- video count if available
- existing trip/day context

No real video understanding yet.

v0.2 material input:

Let user select photos/videos from a trip day.

App records:

- selected photo count
- selected video count
- optional user note:
  "What do you want to express?"

Still no heavy AI video analysis.

v0.3 material input:

Optional AI vision analysis:

- image description
- scene tags
- color/mood suggestions
- people/object detection only if privacy rules are clear

Do not start here.

## Recommended MVP Flow

For the next usable product version:

1. User opens AI Content screen.
2. User selects trip/day.
3. User selects platform:
   - 朋友圈
   - 小红书
   - 抖音
4. User selects style:
   - 松弛治愈
   - 高级冷感
   - 实用攻略
   - 震撼风景
   - 亲子家庭
   - 公路旅行
5. User taps Generate.
6. App generates one platform-specific publish package.
7. User copies the result.

## Current Implementation Status

Already implemented:

- WeChat Moments AI mode
- Xiaohongshu note AI mode
- Douyin publish package AI mode
- Domestic prompt builder
- Domestic AI modes and style guide
- Legacy social mode hidden
- Mode-specific token budgets
- AI region/task routing support

Not yet implemented:

- Platform/style two-step selector
- Photo/video material selector
- Publish package unified result UI
- Real video/image understanding
- Direct publishing to domestic social apps
- Real ad SDK unlock flow

## Do Not Build Yet

Do not build:

- Real PS-style photo retouching
- Remove passerby / face retouch / sky replacement
- One-click viral video promise
- Direct automatic posting to Douyin/Xiaohongshu/WeChat
- Heavy video analysis pipeline

These are too heavy for current MVP.

## Product Naming

Feature candidates:

- 旅行发布助手
- 一键发布包
- 旅迹发布包
- 旅照发布助手

Recommended name:

旅行发布助手

Reason:

It is broader than copywriting and does not overpromise automatic virality.

## Success Criteria

This feature is promising if:

- Users generate more than one platform output for the same trip day.
- Users copy results often.
- Users come back after another trip day.
- Douyin publish package helps users organize video structure, not just text.
- Xiaohongshu note output is specific and useful.
- WeChat Moments copy feels natural and personal.

## Failure Signals

Redesign if:

- Users only try once and never return.
- Generated output feels too generic.
- Douyin output is only text, not a publish package.
- Users cannot tell the difference between platform outputs.
- The AI page becomes too crowded.
- Cost rises faster than retention or ad value.
