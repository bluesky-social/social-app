# BlueskyNSE

BlueskyNSE is an iOS Notification Service Extension that processes push notifications before they are displayed to the user. NSE stands for "Notification Service Extension", a native iOS app extension type.

## What It Does

This extension intercepts incoming push notifications and performs processing before displaying them:

1. Manages badge counts for app icon
2. Applies custom notification sounds based on user preferences
3. Enables notification customization without requiring the main app to be running

## How It Works

When a push notification arrives on iOS, the system can invoke this extension to modify the notification content before displaying it. The extension runs in a separate process from the main app and has strict time limits (approximately 30 seconds) to complete its work.

### Architecture

The extension uses shared UserDefaults (via App Groups) to access preferences set by the main app:

- **App Group**: `group.app.bsky` allows data sharing between the main app and the extension
- **Shared Preferences**: Stored in UserDefaults suite accessible by both processes
- **Thread Safety**: Uses a dedicated serial DispatchQueue (`NSEPrefsQueue`) to prevent race conditions when multiple notifications arrive simultaneously

### Notification Processing Flow

1. System receives push notification
2. `NotificationService.didReceive()` is called
3. Extension creates mutable copy of notification content
4. Based on notification type (determined by `reason` field):
   - **Chat messages** (`reason == "chat-message"`): Applies custom DM sound if user preference `playSoundChat` is enabled
   - **Other notifications**: Increments and applies badge count
5. Extension delivers modified notification to system via `contentHandler`

### Badge Count Management

Badge counts are managed centrally by the extension:
- Each non-chat notification increments the badge count
- Count is synchronized across notification instances using the serial queue
- Main app can reset the count via the `expo-background-notification-handler` module

### Notification Sounds

Two sound types are supported:
- **Default system sound**: Standard iOS notification sound
- **DM sound**: Custom `dm.aiff` sound file for chat messages

DM sound only plays if the user has enabled the `playSoundChat` preference in the main app's chat settings.

## Key Files

| File | Purpose |
|------|---------|
| `NotificationService.swift` | Main service extension implementation |
| `BlueskyNSE.entitlements` | iOS entitlements configuration for App Group access |
| `Info.plist` | Extension metadata and configuration |

### NotificationService.swift

Contains two main classes:

**NotificationService**: The main extension class that implements `UNNotificationServiceExtension`
- `didReceive(_:withContentHandler:)`: Processes incoming notifications
- `serviceExtensionTimeWillExpire()`: Handles timeout scenarios
- Mutation methods for modifying notification content

**NSEUtil**: Singleton utility class for shared state management
- Provides shared `UserDefaults` instance for the App Group
- Manages serial queue for thread-safe preference access
- Helper methods for notification content manipulation

## Configuration

### App Group Setup

The extension requires the `group.app.bsky` App Group to be configured in:
1. Main app target capabilities
2. Extension target capabilities (defined in `BlueskyNSE.entitlements`)

### Shared Preferences

The following preferences are shared between the main app and extension:

| Preference Key | Type | Purpose |
|----------------|------|---------|
| `badgeCount` | Int | Current badge count for app icon |
| `playSoundChat` | Bool | Whether to play sound for chat notifications |

These are managed by the `expo-background-notification-handler` module in the main app.

### Sound Files

The custom DM sound file (`dm.aiff`) must be included in the extension's bundle. The iOS project configuration handles copying this resource during the build.

## Platform Support

- **iOS**: Fully supported (primary platform for this extension)
- **Android**: Not applicable (Android uses different notification handling mechanisms)
- **Web**: Not applicable (web notifications are handled by browser APIs)

## Integration with Main App

The extension coordinates with the main app through:

1. **expo-background-notification-handler** module: Provides JavaScript API for managing shared preferences
2. **App Group shared storage**: Enables data synchronization between processes
3. **Push notification payload**: Must include `reason` field to determine notification type

### Setting User Preferences

Users can control notification sounds via the Chat Settings screen (`src/screens/Messages/Settings.tsx`):

```typescript
import {useBackgroundNotificationPreferences} from '../../../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'

const {preferences, setPref} = useBackgroundNotificationPreferences()
setPref('playSoundChat', true) // Enable DM sounds
```

## Limitations

1. **Time constraints**: Extension must complete processing within ~30 seconds or the system will terminate it
2. **Process isolation**: Runs in separate process with limited memory and resources
3. **iOS only**: Notification Service Extensions are an iOS-specific feature
4. **Concurrent processing**: Multiple notifications may arrive simultaneously, requiring careful state management

## Best Practices

When modifying this extension:

1. Keep processing fast and synchronous when possible
2. Use the shared serial queue for any UserDefaults mutations
3. Avoid network requests that could cause timeouts
4. Always call `contentHandler` with modified content, even on errors
5. Test with multiple concurrent notifications to verify thread safety
