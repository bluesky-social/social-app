## Scheduler delegate invalidation - iOS use-after-free

Fixes Sentry issue APP-T28X: an `EXC_BAD_ACCESS` in
`Scheduler::uiManagerDidFinishTransaction` or
`Scheduler::uiManagerDidDispatchCommand` after a queued rendering update
outlives its captured raw `SchedulerDelegate` pointer.

React Native 0.86 contains the invalidation-token guard from
facebook/react-native#56680, but `enableSchedulerDelegateInvalidation` is false
for the stable release level used by Expo. Override only this flag in
`ReactNativeFeatureFlagsOverridesOSSStable` instead of opting the app into all
experimental React Native flags.

**TODO: Remove after upgrading to a React Native release that closes the
queued Scheduler delegate lifetime race by default.**
