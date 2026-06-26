# WanderNote Watch Companion Plan

## Product direction

The watch app starts as a WanderNote companion, but its architecture should remain brand-neutral so it can later become a standalone outdoor travel app.

## Initial modules

- Outdoor Glance
- Sun Events
- Return to Car
- Daily Steps

## Architecture rules

- Watch UI is native SwiftUI.
- Keep core model names brand-neutral.
- Avoid hardcoded user-facing strings.
- Support English, Simplified Chinese, and Traditional Chinese from day one.
- Do not add maps, route navigation, AI, or community features in the first phase.

## Current status

- Native iOS project is now tracked because Watch App and future WidgetKit targets live under ios/.
- TravelWatchCompanion Watch App target has been created.
- Initial SwiftUI mock screen has been added.
- Watch localization currently supports en, zh-Hans, and zh-Hant.
- Local watchOS SDK is not installed yet, so watchOS compilation is pending.

## Pending

- Install watchOS platform in Xcode Components.
- Run watch target build.
- Add real location altitude provider.
- Add HealthKit steps provider.
- Add Sun Events provider.
- Add Return to Car storage and distance calculation.
- Add WidgetKit complication later.
