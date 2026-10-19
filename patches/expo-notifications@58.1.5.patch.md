## LOAD BEARING PATCH, DO NOT REMOVE

## Expo-Notifications Patch

This patch supports the Android background notification handling module. Incoming messages
in `onMessageReceived` are sent to the module for handling.

It also allows us to set the Android notification channel ID from the notification `data`, rather
than the `notification` object in the payload.

All hunks are Android-only, and expo-notifications ships a prebuilt Android AAR, so it must stay in
`expo.autolinking.android.buildFromSource` or Gradle links the unpatched AAR and none of this applies.
The `android/build.gradle` hunk depends on the local `@bsky.app/expo-background-notification-handler`
module, whose Gradle project name autolinking derives as `:bsky-app-expo-background-notification-handler`.

### `NotificationContent` serialization

`writeObject` writes `mChannelId` first, so `readObject` now reads it first too. Before SDK 58 the
patch only added the write, which would misalign every field when a scheduled notification is read
back from SharedPreferences (the only place `NotificationContent` goes through Java serialization;
the app does not schedule local notifications, so this was latent). `mChannelId` is always null for
`NotificationContent`; it exists to satisfy `INotificationContent.channelId`.
