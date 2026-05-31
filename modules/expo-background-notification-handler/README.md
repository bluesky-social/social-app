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

Uses SharedPreferences with Firebase Cloud Messaging (FCM) to handle background notifications. The module tracks app foreground/background state and conditionally processes notifications based on whether the app is foregrounded.

**Key Files:**
- `android/src/main/java/expo/modules/backgroundnotificationhandler/ExpoBackgroundNotificationHandlerModule.kt` - Expo module definition
- `android/src/main/java/expo/modules/backgroundnotificationhandler/NotificationPrefs.kt` - SharedPreferences wrapper
- `android/src/main/java/expo/modules/backgroundnotificationhandler/BackgroundNotificationHandler.kt` - Notification processing logic
- `android/src/main/java/expo/modules/backgroundnotificationhandler/BackgroundNotificationHandlerInterface.kt` - Interface for showing notifications
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
} from 'expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'

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

The Android implementation includes logic for processing notifications while the app is backgrounded:

- **Chat messages**: Applies custom notification channels based on `playSoundChat` preference
  - Sound enabled: Uses `chat-messages` channel (or `dm.mp3` sound on older Android)
  - Sound disabled: Uses `chat-messages-muted` channel

- **Other notification types**: On Android Oreo+ (API 26+), assigns notifications to channels based on reason:
  - Supported reasons: `like`, `repost`, `follow`, `mention`, `reply`, `quote`, `like-via-repost`, `repost-via-repost`, `subscribed-post`
  - Each reason maps to its corresponding notification channel

When the app is foregrounded, the module defers to `expo-notifications` for notification handling.

## Configuration

### iOS

Requires App Group entitlement configured in Xcode:
- App Group ID: `group.app.bsky`

### Android

Requires Firebase Cloud Messaging (FCM) integration:
- Dependency: `com.google.firebase:firebase-messaging-ktx:24.0.0`
- SharedPreferences name: `xyz.blueskyweb.app`

## Usage in the App

The module is used to:

1. Store notification preferences that need to be accessed by notification service extensions
2. Track app foreground/background state on Android
3. Process and mutate notification payloads based on user preferences before display
4. Manage notification badge counts on iOS
5. Handle thread muting and other notification filtering logic

By keeping preferences in shared storage, the notification service extension can make intelligent decisions about notification presentation without waking up the React Native runtime or making network requests.
