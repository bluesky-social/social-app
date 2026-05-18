## LOAD BEARING PATCH, DO NOT REMOVE

## Expo-Notifications Patch

This patch supports the Android background notification handling module. Incoming messages
in `onMessageReceived` are sent to the module for handling.

It also allows us to set the Android notification channel ID from the notification `data`, rather
than the `notification` object in the payload.

### `setBadgeCountAsync` fix on Android

`ShortcutBadger`'s `setCount` doesn't work for clearing the badge on Android for some reason. Instead, let's use the
Android API for clearing the badge.
