## expo-splash-screen Patch

Fixes a fatal crash on Android 12 and 13 (API 31-33) when the app is backgrounded while the
native splash screen is still showing ([APP-3474](https://linear.app/blueskyweb/issue/APP-3474),
Sentry [APP-CA](https://blueskyweb.sentry.io/issues/APP-CA)):

```
NullPointerException: Attempt to invoke direct method 'void android.view.SurfaceControl.checkNotReleased()' on a null object reference
  at android.view.SurfaceControl$Transaction.hide
  at android.app.ActivityThread.syncTransferSplashscreenViewTransaction
```

### What it does

On API 31-33 the patch skips `setOnExitAnimationListener`, so the system dismisses the splash with its
own default exit animation instead of Expo's 400ms fade. It also removes the `onActivityStopped`
mitigation from [expo/expo#44584](https://github.com/expo/expo/pull/44584), which does nothing once
the listener is gone.

Because `expo-splash-screen` ships a prebuilt AAR, it is also listed in
`expo.autolinking.android.buildFromSource` in `package.json`. Without that, Gradle uses the
unpatched AAR and this patch has no effect.

### Why

This is a platform bug ([Google issue 242118185](https://issuetracker.google.com/issues/242118185)).
On resume, the app tells the server whether an exit listener is registered, and the server records
it in `ActivityRecord.mHandleExitSplashScreen`. If the activity then stops with the splash still up,
`notifyAppStopped()` -> `removeStartingWindow()` begins copying the splash into the app's window.
The starting window is torn down mid-copy, so `onCopySplashScreenFinish` hands the client a null
leash, and the next draw crashes. Android 14 fixed this on the server side with a
`mStartingWindow.mRemoved` check.

Expo's mitigation clears the listener in `onStop`, but the server only re-reads the flag on the next
resume, so by then it's too late. zoontek reached the same conclusion in
[react-native-bootsplash#381](https://github.com/zoontek/react-native-bootsplash/issues/381).
Never registering the listener on the affected API levels means the transfer path never runs.

### Removing this patch

Remove it once expo-splash-screen stops registering the exit listener on API 31-33, or once we drop
support for Android 12 and 13. Remove the `buildFromSource` entry at the same time.
