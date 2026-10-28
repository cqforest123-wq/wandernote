# WanderNote App Store Release Pack: 1.1.2 (12)

Status: metadata draft for the current local-first product. The binary, screenshots,
privacy answers and final App Store Connect version record still require release verification.

## Build Identity

- Marketing version: `1.1.2`
- Build number: `12`
- Bundle ID: `com.litao0729.wandernote`
- iPad native support: disabled (`supportsTablet: false`)
- Product model: free, local-first travel journal; no login, cloud sync, in-app backup,
  export/import, ads, subscriptions or in-app purchases.
- Content generation: local templates and drafts. Do not describe it as AI-generated.
- Watch: optional companion for travel snapshots and daily outdoor information. Do not
  claim physical-device sensor workflows until the paired-device checklist is complete.

Do not attach an older archive to these materials. Code and metadata must come from the
same final source revision. The current local archive was created before the latest icon
and the latest source commits, so a fresh archive is required after release approval.

## English (U.S.)

Name:

```text
WanderNote
```

Subtitle:

```text
Travel journal & trip planner
```

Promotional text:

```text
Plan trips, keep notes and photos, organize packing lists, and turn your records into travel drafts. Your records stay on this device.
```

Keywords (under 100 bytes; confirm in App Store Connect):

```text
travel,journal,trip,planner,diary,packing,list,memo,map,weather,photos,watch
```

Description:

```text
WanderNote keeps your travel plans and memories together on your device.

Create trips, record daily notes and photos, organize packing checklists, track travel expenses separately by currency, check destination weather, and view your travel records on a map. Local writing templates help turn your notes into a diary draft, trip summary, social caption, or a simple itinerary outline.

With the optional Apple Watch companion, you can view a travel snapshot and daily outdoor details such as steps, daylight, altitude, and a saved parking location when the relevant data and permissions are available.

Your trips and notes are stored locally. This version has no account, cloud sync, in-app backup, export, or import. Deleting the app, changing devices, or device damage may make records unrecoverable. Keep another copy of anything important.

Weather, city search, geocoding, maps, and navigation use their respective network services and may be unavailable offline. Saved travel records remain available on the device.
```

What's New:

```text
This update focuses WanderNote on private, on-device travel journaling. It adds a local expense ledger, improves journal search and sharing, fixes opening trips from the map, and makes local drafts follow your selected language. Incomplete photo filters have been removed. Your records are not backed up or synced by the app.
```

## 简体中文

名称：

```text
WanderNote
```

副标题：

```text
旅行日记与行程规划
```

推广文本：

```text
记录旅程、照片与每日见闻，整理打包清单，并用本地模板生成旅行草稿。旅行记录保存在本机。
```

关键词（提交前在 App Store Connect 检查字符/字节限制）：

```text
旅行日记,行程,打包清单,游记,旅行记录,旅行地图,天气,照片
```

描述：

```text
WanderNote 帮你在本机整理旅行计划与旅途回忆。

创建旅程，记录每日笔记和照片，管理打包清单，按币种分别记录旅行花费，查看目的地天气，并在地图上浏览旅行记录。本地写作模板可以把已有笔记整理成日记草稿、旅程总结、社交文案或简单行程提纲。

可选的 Apple Watch Companion 可查看旅行速览和每日户外信息；步数、日照、海拔与停车位置等内容取决于数据是否可用以及相关权限设置。

旅行记录保存在本机。本版本不提供账号、云同步、应用内备份、导出或导入。删除 App、更换设备或设备损坏可能导致记录无法恢复，请另行保存重要内容。

天气、城市搜索、地理编码、地图和导航依赖相应网络服务，离线时可能不可用；已保存在本机的旅行记录仍可访问。
```

本次更新：

```text
本次更新聚焦于本机旅行记录：新增旅行花费账本，改善日记搜索与分享，修复地图打开旅程的入口，并让本地草稿跟随界面语言。未完整实现的照片滤镜已移除。旅行记录不会由应用同步或备份。
```

## App Review Notes

```text
WanderNote 1.1.2 (12) is a free, local-first travel journal. No account is required. Trips, notes, checklists and selected media are stored in the app on the device. This version has no cloud sync, in-app backup, export/import, ads, subscriptions, In-App Purchases, or external purchase flow.

Writing and itinerary drafts are produced from on-device templates; this build does not call an online AI service. Weather, city search/geocoding, maps, and navigation use external network services. The Apple Watch app is an optional companion and may show unavailable states when data or permissions are unavailable.
```

## Screenshot Capture List

Capture the final submitted build, not a development build with debug UI. Use real app screens,
remove personal data, confirm no stale paid or online-service claims, and export opaque PNGs.

### iPhone 17 Pro

Required product-page size: `1206 × 2622` portrait. `supportsTablet` is false, so no iPad
product-page screenshots are currently expected. Verify App Store Connect's device selector.

1. Trips home with representative sample trips: “Keep every trip together”.
2. Trip detail with dates and destination: “A clearer plan for every journey”.
3. Packing list: “Get ready with reusable checklists”.
4. Travel draft result using sample notes: “Turn your notes into a travel draft”.
5. Trip map or photo journal: “Keep places and memories together”.
6. Profile showing local-storage notice: “Your records stay on this device”.

### Apple Watch Series 11

If the Watch app is included in the submitted app record, Apple requires Watch screenshots.
Capture actual current Watch UI at `416 × 496` pixels; use one consistent size across locales.
Only include screens verified on the paired physical Watch:

1. Travel snapshot with sample destination.
2. Daily Glance with available data or clearly represented unavailable states.
3. Saved parking view, only after end-to-end verification.

Do not use fabricated screens or claim that Watch permissions/data are guaranteed. No screenshot
files are included in this release pack yet.

## Submission Gates

- Rebuild and archive the exact final source revision; the existing 1.1.2 (12) archive predates
  the latest commits and must not be uploaded as-is.
- Confirm the next App Store Connect version/build assignment; do not reuse build 12 if it has
  already been uploaded or processed.
- Complete real-device Watch verification before marketing Watch sensor details or capturing
  Watch screenshots.
- Verify the published privacy-policy URL and App Store Connect privacy answers against the
  final binary and its network providers.
- Upload the final screenshots, check all localized fields, age rating, support URL and review
  contact details, then inspect the App Store Connect submission page before sending for review.

Apple references:

- [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)
- [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)
