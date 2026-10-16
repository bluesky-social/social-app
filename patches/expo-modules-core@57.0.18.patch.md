## expo-modules-core Patch

### Android: bitdrift interceptor

Fixes an issue where bitdrift's API stream gets blocked by the Expo interceptor used to power the devtools.

### iOS: Kahvi runtime

When `USE_KAHVI=1`, ExpoModulesCore must depend on `react-native-kahvi` instead
of selecting Hermes or the removed-from-core `React-jsc` pod. React Native's
Kahvi-aware CocoaPods helpers define this engine flag.
