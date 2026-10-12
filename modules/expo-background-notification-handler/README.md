# expo-background-notification-handler

A custom Expo module for managing shared notification preferences and handling background notifications in the Bluesky Social app. This module enables communication between the main app and notification service extensions through shared storage.

## Purpose

This module solves a critical problem in native notification handling: notification service extensions run in a separate process from the main app and cannot directly access React Native state or APIs. The module provides a bridge by storing notification preferences in shared storage that both the main app and notification service extension can access.

The primary use case is storing user preferences (like notification sound settings) while the app is foregrounded or backgrounded, minimizing the need for background fetches when processing notifications.

## Platform Support

- **iOS**: Full support via UserDefaults with App Groups
- **Android**: Full support via SharedPreferences
- **Web**: Stub implementation (no-op)

## Architecture

### iOS Implementation

Uses iOS App Groups (`group.app.bsky`) to share UserDefaults between the main app and the notification service extension. This allows the notification service extension to read preferences set by the main app without launching the app.

**Key Files:**
- `ios/ExpoBackgroundNotificationHandlerModule.swift` - Native module implementation
- `ios/ExpoBackgroundNotificationHandler.podspec` - CocoaPods specification

### Android Implementation

Uses SharedPreferences for preferences, and replaces expo-notifications' Firebase Cloud Messaging (FCM) service so incoming pushes can be adjusted before expo handles them. See "Android Notification Handling" below.

**Key Files:**
- `android/src/main/java/expo/modules/backgroundnotificationhandler/ExpoBackgroundNotificationHandlerModule.kt` - Expo module definition
- `android/src/main/java/expo/modules/backgroundnotificationhandler/NotificationPrefs.kt` - SharedPreferences wrapper
- `android/src/main/java/expo/modules/backgroundnotificationhandler/BlueskyFirebaseMessagingService.kt` - FCM service, registered in `android/src/main/AndroidManifest.xml`
- `android/src/main/java/expo/modules/backgroundnotificationhandler/BlueskyFirebaseMessagingDelegate.kt` - Adjusts incoming pushes, then hands them to expo-notifications
- `android/build.gradle` - Build configuration

### TypeScript/React API

**Key Files:**
- `index.ts` - Module entry point
- `src/ExpoBackgroundNotificationHandlerModule.ts` - Native module binding (iOS/Android)
- `src/ExpoBackgroundNotificationHandlerModule.web.ts` - Web stub
- `src/ExpoBackgroundNotificationHandler.types.ts` - TypeScript type definitions
- `src/BackgroundNotificationHandlerProvider.tsx` - React Context provider for preferences

## Stored Preferences

The module manages the following notification preferences:

```typescript
{
  playSoundChat: boolean,        // Currently exposed to TypeScript
  playSoundFollow: boolean,      // Native only (not yet exposed)
  playSoundLike: boolean,        // Native only (not yet exposed)
  playSoundMention: boolean,     // Native only (not yet exposed)
  playSoundQuote: boolean,       // Native only (not yet exposed)
  playSoundReply: boolean,       // Native only (not yet exposed)
  playSoundRepost: boolean,      // Native only (not yet exposed)
  mutedThreads: [String: [String]], // iOS only
  badgeCount: number            // iOS only
}
```

Default values are initialized when the module is created, with most sound preferences defaulting to `false` except `playSoundChat` which defaults to `true`.

## API

### Core Methods

```typescript
// Get all preferences
getAllPrefsAsync(): Promise<BackgroundNotificationHandlerPreferences>

// Get individual values
getBoolAsync(forKey: string): Promise<boolean>
getStringAsync(forKey: string): Promise<string>
getStringArrayAsync(forKey: string): Promise<string[]>

// Set individual values
setBoolAsync(forKey: string, value: boolean): Promise<void>
setStringAsync(forKey: string, value: string): Promise<void>
setStringArrayAsync(forKey: string, value: string[]): Promise<void>

// Array manipulation
addToStringArrayAsync(forKey: string, value: string): Promise<void>
removeFromStringArrayAsync(forKey: string, value: string): Promise<void>
addManyToStringArrayAsync(forKey: string, value: string[]): Promise<void>
removeManyFromStringArrayAsync(forKey: string, value: string[]): Promise<void>

// Badge count (iOS only)
setBadgeCountAsync(count: number): Promise<void>
```

### React Context API

The module provides a React Context provider for managing preferences in the app:

```typescript
import {
  BackgroundNotificationPreferencesProvider,
  useBackgroundNotificationPreferences,
} from '@bsky.app/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'

function App() {
  return (
    <BackgroundNotificationPreferencesProvider>
      <YourApp />
    </BackgroundNotificationPreferencesProvider>
  )
}

function SettingsScreen() {
  const {preferences, setPref} = useBackgroundNotificationPreferences()

  return (
    <Toggle
      value={preferences.playSoundChat}
      onValueChange={(value) => setPref('playSoundChat', value)}
    />
  )
}
```

## Android Notification Handling

expo-notifications registers its FCM service (`ExpoFirebaseMessagingService`) at intent-filter priority -1 so that apps can replace it. `BlueskyFirebaseMessagingService` extends it at the default priority, so FCM delivers to ours instead, and swaps in `BlueskyFirebaseMessagingDelegate`. The delegate:

- **Chat pushes** (`chat-*` reasons): assigns them to the `chat` notification channel, which is created in JS by `src/lib/notifications/channels.ts`. Chat pushes are data-only, so the channel can't be set server-side. If the channel doesn't exist yet, expo falls back to its default channel.
- **Mark-read pushes** (`mark-read-*` reasons): drops them. They have no content and nothing handles them yet.
- **Everything else**: passes through to expo-notifications unchanged.

Social notifications (likes, replies, etc.) are FCM *notification* messages, so FCM displays them itself while the app is in the background, without calling this service. Their channel has to be set server-side.

Note that `RemoteMessage.data` can't be mutated to change how expo presents a message - expo parcels the message to its receiver, which rebuilds it from the message's backing bundle. Build a new `RemoteMessage` from an edited copy of the bundle instead.

## Configuration

### iOS

Requires App Group entitlement configured in Xcode:
- App Group ID: `group.app.bsky`

### Android

Requires Firebase Cloud Messaging (FCM) integration:
- Dependencies: `expo-notifications` and `com.google.firebase:firebase-messaging` (keep in step with expo-notifications' version)
- `expo-notifications` must stay in `expo.autolinking.android.buildFromSource` in the app's `package.json`. It ships a prebuilt AAR, and otherwise there's no `:expo-notifications` Gradle project for this module to depend on.
- SharedPreferences name: `xyz.blueskyweb.app`

## Usage in the App

The module is used to:

1. Store notification preferences that need to be accessed by notification service extensions
2. Assign incoming chat pushes to their notification channel on Android
3. Process and mutate notification payloads based on user preferences before display (iOS)
4. Manage notification badge counts on iOS
5. Handle thread muting and other notification filtering logic

By keeping preferences in shared storage, the notification service extension can make intelligent decisions about notification presentation without waking up the React Native runtime or making network requests.
