# WanderNote 开发盘点与后续计划

盘点日期：2026-10-27  
代码仓库：`/Users/litao/Developer/wandernote-watch`  
分支：`feature/watch-companion-v1-integration`  
本地版本：`1.1.2 (12)`，Bundle ID `com.litao0729.wandernote`

## 结论

建议继续做，但下一步不是堆更多功能，而是先修掉发布阻断、跑通当前版本的构建和真机验证，再发布本地优先版本。之后先补用户最在意的数据可迁移能力，再根据 App Store 数据和真实反馈决定是否扩展。

WanderNote 不应试图做成另一个全能行程平台。更有辨识度、也更符合当前实现的是：**轻量旅行规划与旅途记录，资料默认保存在本机，Apple Watch 提供旅程速览**。明确说明天气、搜索、地理编码、地图等仍依赖网络；不要把“本机保存”宣传成所有功能都离线。

## 当前状态

### 已有产品能力

- iPhone：旅程创建与管理、按天记录、笔记和照片、打包清单与模板、地图、天气、旅行草稿、语言设置和本地数据清除。
- 数据：旅程和备忘录保存在本机；媒体会复制到 App Documents。当前版本没有应用内备份、导入导出、账号或云同步。
- 草稿：旅行日记、摘要、社交文案和基础行程轮廓由本地模板生成，不调用在线 AI。界面文案仍需全面核对，避免称为 AI 生成或目的地推荐。
- Watch：iPhone 通过 WatchConnectivity 发送旅程快照；Watch 有 Daily/Travel/Stale 状态、位置/海拔、步数、日照和停车信息。部分行依赖权限、服务或可用数据。
- 发布准备：本地配置为 `1.1.2 (12)`；用户最近提供的 App Store Connect 截图仍显示 `1.1.1 可分发`。发行资料记录 `1.1.2 (12)` 尚缺最终构建、截图、隐私核对和提交确认，上传前仍需在 ASC 核对版本记录与已用 build number。

### 已验证与未验证

- 2026-10-27：`npm run test:local` 13/13 通过；`npm run check` 通过；`npm run check:watch` 的 snapshot、glance、parking、sun 测试通过，静态审计 0 blocker、1 条关闭的 YearReport flag warning。
- Watch target 可单独编译；最新的 Watch 改动仍未装到实机。2026-10-21 最终安装尝试因 CoreDevice Watch 网络隧道超时失败；需要重新安装后完成定位、HealthKit、实时同步、离线/过期、停车和权限流程验证。
- iPhone 宿主 scheme 在当前 checkout 构建失败：Pods 构建阶段找不到 React Native 预编译 `React.xcframework`。这是发布前构建阻断，不可用 Watch 单 target 编译替代。
- 当前测试没有覆盖 `AIScreen` 的实际 React Native 渲染路径。源代码审查发现明确崩溃点：`screens/AIScreen.js` 的 `trips.map(t => ...)` 将外层翻译函数 `t` 遮蔽成旅程对象，随后第 157 行调用 `t('unit_days', ...)`。有旅程时打开默认 AI/旅行草稿页会在渲染旅程卡片时调用非函数对象。这是 **P0 发布阻断**，必须修复并添加回归覆盖。
- 图片源已统一：Expo `assets/icon.png` 与 iOS/Watch AppIcon 使用同一张 1024×1024、无透明通道图；iOS 与 watchOS asset catalog 已由 `actool` 编译验证。线上 1.1.1 不会因源码变化自动更新图标，需随新版本构建提交。

## 同类产品观察

以下比较依据各产品当前 App Store 自述，仅用于定位，不代表对体验或功能质量的独立测评；具体功能可能因版本、地区或付费方案变化。

| 产品 | 主定位与强项 | 对 WanderNote 的启示 |
| --- | --- | --- |
| [Wanderlog](https://apps.apple.com/us/app/wanderlog-travel-planner/id1476732439) | 地图行程、地点排序、多人实时协作、预算/费用和离线计划，覆盖规划全流程。 | 不要追逐它的功能广度；聚焦更简单的个人记录、本机数据所有权与旅途中的快速查看。 |
| [TripIt](https://apps.apple.com/us/app/tripit-travel-planner/id311035142) | 从预订邮件聚合航班、酒店等行程，强调离线查阅、地图和行程提醒。 | 预订导入需要邮箱/服务集成，投入大且偏“旅行资料夹”；不是当前小团队最优先方向。 |
| [Tripsy](https://apps.apple.com/us/app/tripsy-travel-planner/id1429967544) | 日程与多站路线、旅行时间、预订资料、协作、费用、离线和 Apple Watch，覆盖面很广。 | Watch 本身不是差异点，必须让 Watch 的核心数据在实机可靠；暂不追赶路线规划和云协作全套。 |
| [Polarsteps](https://apps.apple.com/us/app/polarsteps-travel-tracker/id947925763) | 自动路线追踪、照片故事、Travel Buddies、分享和旅行统计，偏记录与社交。 | 与其做公开社交，不如做好私人日记。远程实时共享位置和严格无云端是冲突需求，不能暗中承诺两者兼得。 |
| [Journi Blog](https://apps.apple.com/us/app/journi-blog-travel-tracker/id884030844) | 照片、文字、地图时间线，支持离线创作、协作同步和照片书。 | “旅行回忆”已有成熟竞争；本机保存要进一步兑现为简单、可信、可迁移，而不只是一个宣传标签。 |
| [AnalogTrip](https://apps.apple.com/us/app/analogtrip/id6761549290) | 明确主打无账号、完全离线、本机数据，并提供文件导出/导入，包含日程、地图和费用。 | 本机优先并非无人竞争；数据导出/导入是隐私型产品建立信任的重要配套。 |

### 定位提炼

建议把对外信息收敛为：**旅行计划、每日记录和打包清单，在一个轻量、以本机保存为默认的旅行日记里。** Watch 是补充场景，不是主要卖点，直到完整实机测试通过。短期不做公开动态、订房/机票平台、在线 AI、广告或云端好友定位。

## 后续开发路线

### P0：发布前硬化

1. 修复 `AIScreen` 旅程列表回调遮蔽翻译函数的问题；覆盖“0 个旅程 / 有旅程 / 生成草稿 / 切换语言”，确保 AI/草稿入口不会因旅程数据崩溃。同步检查所有 locale 中仍遗留的 AI 生成、在线服务或推荐暗示。
2. 修复 iOS scheme 构建环境：按仓库现有 Expo/CocoaPods 配置恢复所需 React Native 预编译产物，不升级或新增第三方依赖；从 workspace 构建完整 iPhone + Watch app，并确认 `React.xcframework` 进入产物。
3. 对现有安装执行升级验证，不卸载 App：确认既有旅程、笔记和照片不丢；飞行模式下验证本地增删改、重启和保存失败提示。记录网络依赖功能的降级行为。
4. 重新安装最新 Watch build，完成 checklist 中关键链路：iPhone 快照到达、Watch 冷启动缓存、fresh/stale、Location/Altitude、HealthKit Steps、停车保存与导航、断连重连。没有验证通过的传感器能力不要放进商店截图/宣传文案。
5. 以同一代码提交重新生成 archive 和商店素材：iPhone 当前目标截图、Watch 实机截图、图标、审核备注、隐私政策 URL 与 App Privacy 答案。核对 ASC 当前 live version、待审记录和下一个未使用 build number；不复用旧 archive。

**P0 退出条件：** AI 页有旅程时可正常打开；iPhone 宿主与 Watch 都能从同一提交构建；升级不丢本机资料；本机主流程可离线使用；Watch 关键路径完成真实设备验证；App Store 产品页和隐私声明与实际功能一致。

### P1：首发后优先补韧性

1. 增加用户主动控制的本机归档：通过系统文件/分享面板导出旅程、笔记、清单和媒体；提供导入预览、数据校验、重复项策略和失败回滚。格式带 schema version，能解释旧版本兼容；不自动上传、不接第三方云盘 SDK。
2. 把“不提供备份/换机可能丢失”作为当前已知限制，不在首发前悄悄改成云同步。手动归档上线前，继续保留清晰提示和稳定的数据清除确认。
3. 只根据首批用户实际使用决定下一项体验改进。候选方向是更快记录当天见闻、整理照片与地点、完善旅程/打包清单；先做可用性测试，不先做大型路线引擎。

**P1 退出条件：** 导出包可在无账号情况下保存到用户选择的位置；损坏/不兼容归档不会覆盖当前资料；媒体可完整往返；错误状态和用户数据量测试通过。

### P2：有信号后再增长

1. 发布后连续观察 App Store Connect 的曝光、产品页浏览、首次下载和转化；按漏斗判断问题在搜索发现、产品页说服还是首用体验。当前没有这些数据，不能仅凭“下载少”断言应该增加功能。
2. 先做一轮小规模目标用户访谈/可用性测试（独自旅行者、轻量行程记录者），确认他们是否愿意为本机保存、照片日记、清单或 Watch 速览持续使用。
3. 再调整关键词、首屏截图顺序和一句话价值主张；每次只改一组内容，保留对照周期。不要先加第三方行为跟踪。
4. 只有用户明确需要后，才重新评估“队友共享”。一次性分享行程文件/只读摘要可以保持无云端；远程实时位置共享需要网络服务、权限和持续隐私责任，与当前本机优先边界不同，应另立产品决策。

## 暂不做

- 云账号、跨设备云同步、后台位置共享。
- 弹窗/插屏广告或广告 SDK；这会损害旅行场景信任，也与当前隐私定位冲突。
- 在线 AI、目的地推荐、预订邮件接入、公开社交 feed。
- 骑行、骑行追踪、运动记录等与旅行日记定位无关的功能。
- 在没有实测需求前扩展复杂路线优化、费用分摊或平台集成。

## 判断是否继续投入

先完成 P0 并发布，再看真实漏斗。若曝光低，做商店发现度；若有浏览但少下载，优化图标、截图和价值说明；若下载后留存/口碑差，回到首用体验和真实访谈。每个阶段只选一到两个可验证改进，不以功能数量作为进展指标。

## 资料来源

- [Wanderlog App Store listing](https://apps.apple.com/us/app/wanderlog-travel-planner/id1476732439)
- [TripIt App Store listing](https://apps.apple.com/us/app/tripit-travel-planner/id311035142)
- [Tripsy App Store listing](https://apps.apple.com/us/app/tripsy-travel-planner/id1429967544)
- [Polarsteps App Store listing](https://apps.apple.com/us/app/polarsteps-travel-tracker/id947925763)
- [Journi Blog App Store listing](https://apps.apple.com/us/app/journi-blog-travel-tracker/id884030844)
- [AnalogTrip App Store listing](https://apps.apple.com/us/app/analogtrip/id6761549290)
