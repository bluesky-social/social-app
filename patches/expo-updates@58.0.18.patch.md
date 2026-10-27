# Expo-Updates Patch

This is a small patch to convert timestamp formats that are returned from the backend. Instead of relying on the
backend to return the correct format for a specific format (the format required on Android is not the same as on iOS)
we can just add this conversion in.

Don't remove unless we make changes on the backend to support both platforms.

`RCTConvert.nsDate` in React Native 0.88 still only accepts `yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ` (fractional seconds
required), and `ExpoUpdatesUpdate.swift` still passes `commitTime` straight to it, so this is still needed.
