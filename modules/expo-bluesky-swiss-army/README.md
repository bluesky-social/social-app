# expo-bluesky-swiss-army

A collection of native utilities for the Bluesky Social app. This Expo module provides platform-specific functionality that is not available through standard React Native APIs.

## Overview

This module consolidates several native features into a single Expo module:

- **AppLink**: App-only URL handoffs using iOS Universal Links and Android App Links
- **PlatformInfo**: Platform-specific accessibility and audio session management
- **Referrer**: Tracking how users arrive at the app (web referrers, app referrers, Google Play install referrer)
- **SharedPrefs**: Shared preferences storage using native platform APIs (UserDefaults on iOS, SharedPreferences on Android)
- **VisibilityView**: A native view component that tracks which view is currently visible on screen
- **NotificationSettings**: iOS handler that routes the system "notification settings" intent into the app
- **ZoomTransition**: iOS 26+ zoom navigation transition between a view and the screen it opens

## Modules

### AppLink

`AppLink.tryOpen(url): Promise<boolean>` asks the OS to open an HTTP(S) URL
directly in a non-browser app, without opening a browser or showing an app
chooser. It returns `false` when no app handles the URL; callers should continue
through their normal browser flow on `false` or rejection.

- iOS uses Universal Links with `universalLinksOnly`.
- Android 11+ requires a non-browser default handler. Earlier Android versions
  resolve the default handler and exclude browsers and the system chooser.
- Web and native binaries built without the module return `false`.

Adding this module requires rebuilding both native apps; an OTA update alone
will keep the existing browser behavior on older binaries.

### PlatformInfo

Provides platform-specific information and audio session control.

**Functions:**

- `getIsReducedMotionEnabled(): boolean` - Returns whether the user has enabled reduced motion in system settings. Works on all platforms (iOS uses UIAccessibility, Android checks transition animation scale, Web checks CSS media query).

- `setAudioActive(active: boolean): void` - iOS only. Controls whether the app's audio session is active. When deactivated with `false`, it notifies other apps to resume their audio playback.

- `setAudioCategory(category: AudioCategory): void` - iOS only. Sets the AVAudioSession category. Use `AudioCategory.Playback` for video/music playback and `AudioCategory.Ambient` for audio that mixes with other apps.

**Platform Support:**
- iOS: Full support for all functions
- Android: `getIsReducedMotionEnabled()` only
- Web: `getIsReducedMotionEnabled()` only

### Referrer

Tracks how users arrive at the app from external sources.

**Functions:**

- `getReferrerInfo(): ReferrerInfo | null` - Returns information about the source that launched the app. Returns `{referrer: string, hostname: string}` or `null`.
  - **iOS**: Reads from SharedPrefs (set by app extensions or deep link handlers)
  - **Android**: Extracts referrer from Intent extras or activity referrer
  - **Web**: Parses `document.referrer` (excludes bsky.app domain)

- `getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo>` - Android only. Retrieves Google Play install referrer information including install timestamp and click timestamp. Uses the Google Play Install Referrer API.

**Platform Support:**
- iOS: `getReferrerInfo()` only (reads from SharedPrefs)
- Android: Both functions
- Web: `getReferrerInfo()` only

### SharedPrefs

Native key-value storage that persists across app restarts. Uses iOS App Groups (`group.app.bsky`) for sharing data with extensions, and Android SharedPreferences.

**Functions:**

- `setValue(key: string, value: string | number | boolean | null | undefined): void` - Store a value
- `removeValue(key: string): void` - Remove a value
- `getString(key: string): string | undefined` - Get a string value
- `getNumber(key: string): number | undefined` - Get a number value
- `getBool(key: string): boolean | undefined` - Get a boolean value
- `addToSet(key: string, value: string): void` - Add a value to a set
- `removeFromSet(key: string, value: string): void` - Remove a value from a set
- `setContains(key: string, value: string): boolean` - Check if a set contains a value

**Default Values (Android only):**
The Android implementation initializes certain keys with default values on first access:
- `playSoundChat`: true
- `playSoundFollow`: false
- `playSoundLike`: false
- `playSoundMention`: false
- `playSoundQuote`: false
- `playSoundReply`: false
- `playSoundRepost`: false
- `badgeCount`: 0

**Platform Support:**
- iOS: Full support (uses UserDefaults with App Group)
- Android: Full support (uses SharedPreferences)
- Web: Not implemented

**Implementation Notes:**
- iOS uses App Group suite `group.app.bsky` to share preferences with app extensions
- Android stores preferences in `xyz.blueskyweb.app`
- Both platforms work around a bug where `JavaScriptValue.isString()` can cause crashes, so there's a separate `setString` function internally

### VisibilityView

A React Native view component that detects which view is currently "active" based on visibility and position on screen. Only one view can be active at a time across the entire app.

**Component:**

```tsx
<VisibilityView
  enabled={boolean}
  onChangeStatus={(isActive: boolean) => void}
>
  {children}
</VisibilityView>
```

**Props:**
- `enabled: boolean` - Whether this view participates in visibility tracking
- `onChangeStatus: (isActive: boolean) => void` - Callback fired when the view becomes active or inactive
- `children: React.ReactNode` - Child components

**Functions:**

- `updateActiveViewAsync(): Promise<void>` - Manually trigger recalculation of the active view

**How It Works:**

The module maintains a global registry of all VisibilityView instances. When views are added/removed or when explicitly updated, it calculates which view is "most visible":

1. A view must be at least 50% visible on screen
2. If multiple views meet this threshold, the one closest to the top of the screen wins (specifically, the one with the lowest Y position, but must be at least 150px from the top)
3. Only one view can be active at a time - when a new view becomes active, the previous one is deactivated

This is useful for features like video autoplay, where you want to know which video is currently the "primary" one the user is viewing.

**Platform Support:**
- iOS: Full support using UIView position tracking
- Android: Full support using View position tracking
- Web: Passthrough component (renders children without tracking)

### ZoomTransition

iOS 26+ only. The zoom navigation transition from UIKit
(`UIViewController.preferredTransition = .zoom`): the pushed screen grows out of
a view on the previous screen and shrinks back into it on pop. Ported from
expo-router's `Link.AppleZoom`, without the router.

```tsx
// On the screen you navigate from
<ZoomTransition.Source identifier={post.uri} style={styles.thumbnail}>
  <Image ... />
</ZoomTransition.Source>

// Inside the destination screen
<ZoomTransition.Enabler sourceIdentifier={currentPostUri} />
```

- `Source` behaves like a View. Its own frame and corner radius are what the
  transition zooms from.
- `Enabler` renders nothing. It finds its screen's view controller and sets the
  transition before the push starts. UIKit asks for the source view again on
  pop, so changing `sourceIdentifier` while the screen is open changes where it
  zooms back into (e.g. the video you scrolled to).
- Sources are looked up only inside the screen being zoomed from, and only if
  they are currently on screen. Otherwise UIKit falls back to a zoom with no
  source.
- `dismissGesture`: `default` keeps UIKit's swipe-down / pinch / edge-swipe
  dismissal. `horizontal` only allows gestures that start out moving right,
  for screens that scroll vertically. `none` disables interactive dismissal.
- Only works with the default native-stack animation. A custom
  `stackAnimation` makes react-native-screens supply its own animator, which
  overrides the zoom.
- Turn off react-native-screens' back gestures for the screen
  (`gestureEnabled: false`; in the app, `#/components/ZoomTransitionEnabler`
  does this). react-native-screens becomes the delegate of the navigation
  controller's back swipes, and with `fullScreenGestureEnabled` it lets them
  start on zoomed screens too. They race the zoom's own dismiss gestures, and
  when one of them wins (a fast flick, or a swipe while a cancelled one is
  still springing back) the screen pops without following the finger.
- Why not iOS 18, where the API exists: there the zoom can only be swiped back
  from the edge, so the app's swipe back from anywhere has to come from
  react-native-screens. But while a screen has a zoom transition, UIKit ignores
  the interaction controller react-native-screens supplies, so that swipe pops
  the screen without following the finger, and can't be cancelled.
- When a zoom dismiss gesture starts, `Enabler` cancels the React Native
  touches in progress, like react-native-screens does for its own back
  gestures. Otherwise releasing a swipe that started on a pressable would
  press it.
- In debug builds, a back swipe that starts away from the edge doesn't follow
  the finger: the screen only zooms back when you let go. expo-dev-menu's
  three-finger long press on the window holds UIKit's swipe-to-dismiss until
  the touch ends. Release builds don't include the dev menu, so they aren't
  affected.

**Platform Support:**
- iOS 26+: Full support
- iOS < 26, Android, Web: `Source` is a plain View and `Enabler` renders nothing

### NotificationSettings

iOS only. Has no JavaScript surface - it is a pure native side effect registered
at app launch.

When push permissions are requested with `provideAppNotificationSettings: true`,
iOS adds an in-app notification settings button to the system Settings screen for
Bluesky. Tapping it launches the app and triggers
`userNotificationCenter(_:openSettingsFor:)`. expo-notifications owns the
`UNUserNotificationCenter` delegate and fans this callback out to registered
`NotificationDelegate`s. This module registers one and converts the callback into
a `bluesky://settings/notifications` deep link, which the app's existing linking
config routes to the notification settings screen.

**Platform Support:**
- iOS: Full support
- Android: Not applicable (Android opens the system notification settings directly)
- Web: Not applicable

The module uses platform-specific file extensions to provide appropriate implementations:

- `index.ts` - Throws NotImplementedError (base/fallback)
- `index.native.ts` - Calls native modules via Expo Modules Core
- `index.web.ts` - Web-specific implementations or stubs
- `index.ios.ts` / `index.android.ts` - Platform-specific implementations when behavior differs

### Native Layer

**iOS:**
- Swift implementation using Expo Modules Core
- Files organized by feature in subdirectories (PlatformInfo/, Referrer/, SharedPrefs/, Visibility/)
- Uses standard iOS APIs: UIAccessibility, AVAudioSession, UserDefaults, UIView

**Android:**
- Kotlin implementation using Expo Modules Core
- Package structure: `expo.modules.blueskyswissarmy.[feature]`
- Uses standard Android APIs: Settings.Global, InstallReferrerClient, SharedPreferences, View

## Key Files

### TypeScript
- `index.ts` - Main module exports
- `src/NotImplemented.ts` - Error thrown when functionality is not available on current platform
- `src/[Feature]/types.ts` - TypeScript type definitions for each feature
- `src/[Feature]/index.*.ts` - Platform-specific implementations

### iOS
- `ios/ExpoBlueskySwissArmy.podspec` - CocoaPods specification
- `ios/[Feature]/Expo*Module.swift` - Expo module definitions
- `ios/SharedPrefs/SharedPrefs.swift` - Shared preference manager (usable from other native code)
- `ios/Visibility/VisibilityViewManager.swift` - Global view tracking manager

### Android
- `android/build.gradle` - Gradle build configuration (includes installreferrer dependency)
- `android/src/main/java/expo/modules/blueskyswissarmy/[feature]/Expo*Module.kt` - Expo module definitions
- `android/src/main/java/expo/modules/blueskyswissarmy/sharedprefs/SharedPrefs.kt` - Shared preference manager
- `android/src/main/java/expo/modules/blueskyswissarmy/visibilityview/VisibilityViewManager.kt` - Global view tracking manager

## Configuration

### Expo Module Config

The module is registered in `expo-module.config.json`. The PlatformInfo,
Referrer, SharedPrefs, and VisibilityView sub-modules are registered for both iOS
and Android; NotificationSettings is iOS only.

### iOS

Requires iOS 13.4 or later. Uses the App Group `group.app.bsky` for SharedPrefs - ensure this is configured in your app's entitlements.

### Android

- Minimum SDK: 21
- Target SDK: 34
- Requires `com.android.installreferrer:installreferrer:2.2` dependency for Google Play referrer tracking

## Usage Example

```typescript
import {
  PlatformInfo,
  AudioCategory,
  Referrer,
  SharedPrefs,
  VisibilityView
} from 'expo-bluesky-swiss-army'

// Check for reduced motion
const isReducedMotion = PlatformInfo.getIsReducedMotionEnabled()

// Set audio category for video playback (iOS)
PlatformInfo.setAudioCategory(AudioCategory.Playback)
PlatformInfo.setAudioActive(true)

// Check how user arrived at the app
const referrer = Referrer.getReferrerInfo()
if (referrer) {
  console.log('User came from:', referrer.hostname)
}

// Store a preference
SharedPrefs.setValue('lastOpenedAt', Date.now())
SharedPrefs.setValue('hasSeenOnboarding', true)

// Track visible view
<VisibilityView
  enabled={true}
  onChangeStatus={(isActive) => {
    if (isActive) {
      // This view is now the primary visible view
      video.play()
    } else {
      video.pause()
    }
  }}
>
  <VideoPlayer />
</VisibilityView>
```

## Version

Current version: 0.6.0
