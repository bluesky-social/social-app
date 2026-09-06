## expo-modules-core Patch

### Android: bitdrift interceptor

Fixes an issue where bitdrift's API stream gets blocked by the Expo interceptor used to power the devtools.

### iOS + Android: worklets `runSync` migration

Backport of https://github.com/expo/expo/pull/49366 ("[sdk-57] Backport
WorkletRuntime runSync migration"). react-native-worklets 0.12 removed the
deprecated `WorkletRuntime::executeSync`, so the worklets adapters in
`ios/WorkletsAdapter/ExpoWorkletsBridgeProvider.mm` and
`android/src/main/cpp/worklets/WorkletJSCallInvoker.cpp` fail to compile
against it. The patch swaps both call sites to `runSync` (available since
worklets 0.7.0). Required for the react-native-reanimated 4.6.0 /
react-native-worklets 0.12.1 upgrade; drop once expo-modules-core ships a
version containing that PR.
