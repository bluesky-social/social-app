# react-native-worklets 0.13.0: Kahvi runtime

Worklets creates separate runtimes for Reanimated. Replace its Hermes runtime
with `kahvi::makeKahviRuntime`, depend on `react-native-kahvi` from the iOS
podspec, and disable Hermes-only profiling. The upstream patch also redirects
the Android worklet runtime and links its prefab dependency to Kahvi.

Source: Kahvi repository's `react-native/patches/react-native-worklets+0.13.0.patch`.
