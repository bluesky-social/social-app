## Scheduler delegate invalidation - iOS use-after-free (restored guard)

Fixes Sentry issue APP-T28X: an `EXC_BAD_ACCESS` in
`Scheduler::uiManagerDidFinishTransaction` or
`Scheduler::uiManagerDidDispatchCommand` after a queued rendering update
outlives its captured raw `SchedulerDelegate` pointer.

React Native 0.86 shipped an invalidation-token guard for this
(facebook/react-native#56680) behind `enableSchedulerDelegateInvalidation`,
which was false for the stable release level used by Expo, so we overrode that
one flag in `ReactNativeFeatureFlagsOverridesOSSStable` (merged September 2,
2026, first released in 1.132.0). Builds with the override have had no APP-T28X
events: of about 3,450 events in the 90 days to October 17, 2026, all came from
1.129-1.131 except five 1.132.0 events on or before August 26, before the
override merged.

React Native 0.88 removes both the flag and the guard
(https://github.com/react/react-native/pull/58138, commit `9682967a09`).
Upstream now relies on `RuntimeScheduler_Modern::handleTaskError` clearing the
pending task and rendering-update queues before the error handler runs
(https://github.com/react/react-native/pull/56892, commit `9cbddbd478`), which
closes the path where a JS error tears the delegate down. The #58138 commit
message says one window is still open: a delegate dropped and destroyed with no
error involved never reaches `handleTaskError`, so the queued lambda still
dereferences freed memory. We don't know which path APP-T28X takes, so this
patch keeps the guard.

It restores the 0.86 implementation without the flag checks: a
`shared_ptr<atomic<bool>>` token on `Scheduler`, captured into the two deferred
rendering-update lambdas, flipped in `~Scheduler()` and when `setDelegate`
swaps the delegate. To drop it, delete this patch.

**TODO: Remove after upgrading to a React Native release that closes the
no-error teardown window (the "runtime-scheduler-level shutdown signal"
#58138 mentions), or once we decide #56892's queue clearing is enough.**
