# Expo Haptics Patch

Whenever we migrated to Expo Haptics, there was a difference between how the previous and new libraries handled the
Android implementation of an iOS "light" haptic. The previous library used the `Vibration` API solely, which does not
have any configuration for intensity of vibration. The `Vibration` API has also been deprecated since SDK 26. See:
https://github.com/mkuczera/react-native-haptic-feedback/blob/master/android/src/main/java/com/mkuczera/vibrateFactory/VibrateWithDuration.java

Expo Haptics is using `VibrationManager` API on SDK >= 31. See: https://github.com/expo/expo/blob/main/packages/expo-haptics/android/src/main/java/expo/modules/haptics/HapticsModule.kt#L19
The timing and intensity of their haptic configurations though differs greatly from the original implementation. This
patch uses the new `VibrationManager` API to create the same vibration that would have been seen in the deprecated
`Vibration` API.
