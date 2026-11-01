# react-native-reanimated+4.7.1.patch

## Android: do not crash when worklets run during the teardown of the React host

Backports https://github.com/software-mansion/react-native-reanimated/pull/10858.

Fixes an abort that happens when the React host is torn down (a reload, for
example an `expo-updates` restart) while worklets still run on the UI thread:

```
JNI DETECTED ERROR IN APPLICATION: obj == null
  _JNIEnv::CallLongMethod(_jobject*, _jmethodID*, ...)
  reanimated::NativeProxy::getAnimationTimestamp()
  ...
  worklets::UIScheduler::triggerUI()
  com.swmansion.worklets.AndroidUIScheduler.mUIThreadRunnable
```

`NativeProxy::invalidateCpp()` reset `javaPart_`, but the functions returned by
`bindThis` captured a raw `this` and called JNI on `javaPart_` without checking
it. Some of them are globals of the UI runtime (`_getAnimationTimestamp`,
`_setGestureState`). Worklets owns that runtime, so they outlive the
invalidation.

React Native invalidates TurboModules on a background thread, in the order in
which they were first requested. When `ReanimatedModule` goes before
`WorkletsModule`, the UI scheduler of Worklets is still active, and the first
worklet that starts an animation aborts the app. Since Worklets 0.13
`WorkletsModule` is normally requested first, which hides the bug, but nothing
guarantees the order.

The patch touches `android/src/main/cpp/reanimated/android/NativeProxy.{h,cpp}`:

- `bindThis` captures `weak_from_this()` and returns a default value once the
  Java part is released.
- `invalidateCpp()` drops a new `strongThis_` reference instead of resetting
  `javaPart_`. `javaPart_` is released when the last reference goes, so a bound
  call that runs on another thread during the invalidation still has a valid
  Java part.
- The one-off `javaPart_` check in `maybeFlushUIUpdatesQueue` is gone, because
  `bindThis` covers it now.

The changelog fragment from the PR is left out, because it is not part of the
published package.

Remove once we upgrade to a Reanimated release that includes the PR.
