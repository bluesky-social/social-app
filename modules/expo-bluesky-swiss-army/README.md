# expo-bluesky-swiss-army

A collection of native utilities for the Bluesky Social app. This Expo module provides platform-specific functionality that is not available through standard React Native APIs.

## Overview

This module consolidates several native features into a single Expo module:

- **PlatformInfo**: Platform-specific accessibility and audio session management
- **Referrer**: Tracking how users arrive at the app (web referrers, app referrers, Google Play install referrer)
- **SharedPrefs**: Shared preferences storage using native platform APIs (UserDefaults on iOS, SharedPreferences on Android)
- **VisibilityView**: A native view component that tracks which view is currently visible on screen

## Modules

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

## Architecture

### TypeScript Layer

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

The module is registered in `expo-module.config.json` with all four sub-modules for both iOS and Android.

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
