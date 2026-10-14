# WanderNote 1.1.1 App Store Metadata Draft

Purpose: improve App Store conversion before adding more product surface. Use these drafts only after
the submitted build and screenshots match the actual UI. Do not mention paid plans, Pro, subscriptions,
or external purchases.

Apple reference limits checked on 2026-10-14:

- App name: 2-30 characters.
- Subtitle: up to 30 characters.
- Promotional text: up to 170 characters.
- Description: up to 4000 characters.
- Keywords: up to 100 bytes; do not duplicate app name/company name or use other app/company names.
- Screenshots: 1-10 per device size, no alpha channel. iPhone Dynamic Island medium display is required;
  iPad 13-inch is required if iPadOS is supported. Apple Watch screenshots are required for Apple Watch
  apps, and one consistent Watch screenshot size must be used across localizations.
- Custom product pages: up to 70 per app; each can have different screenshots, previews, promotional
  text, and assigned keywords.

Sources:

- https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/
- https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
- https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
- https://developer.apple.com/help/app-store-connect/create-custom-product-pages/configure-multiple-product-page-versions/

## Default Product Page - English (US)

Name:

```text
WanderNote
```

Subtitle options:

```text
Travel journal for trips
Trips, journal & Watch
Travel notes and memories
```

Recommended subtitle:

```text
Travel journal for trips
```

Promotional text:

```text
Plan trips, keep memories, create Travel Stories, and check outdoor basics on Apple Watch when you are away from your phone.
```

Keywords:

```text
travel,journal,trip,planner,diary,itinerary,packing,map,watch,parking,weather,notes
```

Description:

```text
WanderNote helps you keep each trip organized before, during, and after you travel.

Create trips, save notes, manage packing lists, check weather, view places on the map, and turn memories into a Travel Story you can keep or share.

Key features:

- Trip planning with dates, destination, notes, weather, and map context
- Packing lists and reusable packing templates
- Travel memo and diary tools for capturing moments while they are fresh
- AI-assisted Travel Story generation with a local fallback when online AI is unavailable
- Apple Watch companion glance for travel and outdoor basics
- Return to Parking helper on Apple Watch
- English, Simplified Chinese, and Traditional Chinese support

WanderNote is designed for travelers who want a calmer way to remember where they went, what they packed, and what mattered along the way.
```

What's New:

```text
This update improves the WanderNote travel experience with Apple Watch companion groundwork, more reliable Travel Story generation, and general stability fixes.
```

App Review notes:

```text
This version is free. It does not include subscriptions, In-App Purchases, external purchases, or paid feature unlocks.

Travel Story generation includes a local fallback. If the online AI service is unavailable, times out, returns an empty response, or returns an invalid response, the app generates a local Travel Story so the user does not see a failed or blank result.
```

## Default Product Page - Simplified Chinese

Name:

```text
WanderNote
```

Subtitle options:

```text
旅行日记与行程记录
旅程、清单与游记
记录每一次旅行
```

Recommended subtitle:

```text
旅行日记与行程记录
```

Promotional text:

```text
规划行程、记录旅途、整理清单、生成游记，还可以在 Apple Watch 上查看旅行和户外信息。
```

Keywords:

```text
旅行日记,行程规划,打包清单,地图天气,停车记录,游记记录,旅行攻略
```

Description:

```text
WanderNote 帮你把每一次旅行整理得更清楚。

你可以创建旅程、记录笔记、管理打包清单、查看天气和地图，并把旅行记忆生成一篇可以保存或分享的游记。

主要功能：

- 创建旅程，记录目的地、日期、笔记、天气和地图信息
- 打包清单与常用清单模板
- 旅行备忘与日记，及时记录路上的细节
- AI 辅助生成旅行故事；在线 AI 不可用时，会自动生成本地游记
- Apple Watch 旅行与户外速览
- Apple Watch 返回停车点辅助
- 支持英文、简体中文和繁体中文

WanderNote 适合想轻松记录旅程、整理清单、保存回忆的旅行者。
```

What's New:

```text
本次更新改进了旅行记录体验，加入 Apple Watch Companion 相关基础能力，提升 Travel Story 生成可靠性，并修复若干稳定性问题。
```

App Review notes:

```text
当前版本为免费应用，不包含订阅、App 内购买、外部购买或付费功能解锁。

Travel Story 已加入本地 fallback：当在线 AI 服务不可用、超时、返回空内容或返回无效内容时，应用会自动生成本地旅行故事，避免用户看到失败、空白或一直加载。
```

## Screenshot Storyboard

Default product page screenshots should lead with the clearest user value, not internal feature breadth.

1. Trips overview: "Plan every trip in one place"
2. Trip detail + weather: "Dates, weather, notes, and map context"
3. Packing list: "Pack with reusable checklists"
4. Travel Story: "Turn moments into a story"
5. Map or places: "See your trip on the map"
6. Profile/language/settings: "Simple, multilingual travel notes"

If Apple Watch screenshots are required for the 1.1.1 build, use verified physical or simulator Watch UI
after the real-device pass:

1. Travel Mode glance
2. Daily Glance fallback
3. Return to Parking saved state
4. Stale cached trip state

Do not use Watch-led screenshots until the Watch app has been verified on the physical Apple Watch.

## Product Page Optimization

Run only after 1.1.1 is approved and the default screenshots are stable.

Control:

```text
General travel journal positioning.
```

Treatment A:

```text
Travel journal and memory keeping first. Lead screenshots: trips, trip detail, Travel Story.
```

Treatment B:

```text
Apple Watch companion first. Lead screenshots: iPhone trip + Watch Travel Mode + Return to Parking.
Use only after physical Watch verification passes.
```

Treatment C:

```text
Packing and trip organization first. Lead screenshots: packing templates, checklist, trip detail.
```

Success metric:

```text
App Store product page conversion rate and first-time downloads, not impressions alone.
```

## Custom Product Pages

Create after the default page is approved.

Watch Companion page:

```text
Reference name: Watch Companion
Audience: Apple Watch users and travel/outdoor users
Promotional text: Check trip, daylight, steps, altitude, and parking basics from your wrist while traveling.
Use only after physical Watch verification passes.
```

Packing page:

```text
Reference name: Packing Lists
Audience: users searching for packing checklist / trip checklist
Promotional text: Keep reusable packing templates and trip-specific checklists ready before you leave.
```

Travel Story page:

```text
Reference name: Travel Story
Audience: travel diary / journal users
Promotional text: Turn notes and trip details into a travel story you can save or share.
```

