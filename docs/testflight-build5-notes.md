# WanderNote Build 5 Test Notes

## 中文

感谢参与 WanderNote Build 5 测试。

本版本重点：
- 提升弱网络环境下的稳定性
- 支持无法立即匹配地点时继续创建旅程
- App 后续会自动尝试重新匹配地点
- 恢复免费版最多 3 个旅程限制
- 优化地图与地点处理稳定性

请重点测试：

### 1. 创建普通旅程
- 搜索正常城市
- 创建旅程
- 打开地图确认正常显示

### 2. 创建无法识别的地点
例如：
- random island test
- abc travel place

确认：
- 旅程仍然能创建
- 会提示“网络恢复后会自动匹配地点”
- 地图页面不会崩溃

### 3. AI 功能
- AI itinerary 是否正常生成
- AI packing checklist 是否正常生成
- 是否出现重复生成问题

### 4. 免费版限制
确认：
- 免费用户最多只能创建 3 个旅程
- 第 4 个旅程会被限制
- 已创建旅程内 AI 功能仍可使用

### 5. 请反馈
如果遇到地图异常、地点错误、无限加载、UI 错乱、崩溃或 AI 无响应，请尽量附带截图、操作步骤、网络环境和城市/国家。

---

## English

Thank you for testing WanderNote Build 5.

Main improvements in this build:
- Better reliability under weak network conditions
- Trips can now be created even if location matching fails initially
- The app will retry location matching automatically later
- Free plan limit restored to 3 trips
- Improved destination and map stability

Please focus on testing:

### 1. Normal trip creation
- Search a real city
- Create a trip
- Open the map and confirm it displays correctly

### 2. Unknown / invalid locations
Examples:
- random island test
- abc travel place

Confirm:
- The trip can still be created
- A message appears explaining location matching will retry later
- The map screen does not crash

### 3. AI features
- AI itinerary generation
- AI packing checklist generation
- Confirm there is no duplicate generation issue

### 4. Free plan limits
Confirm:
- Free users can create up to 3 trips
- The 4th trip is blocked
- AI still works inside existing trips

### 5. Please report
If you encounter map issues, wrong locations, infinite loading, broken UI, crashes, or AI not responding, please include screenshots, steps to reproduce, network type, and city/country.
