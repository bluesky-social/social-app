# expo-modules-jsi 57.1.0: Kahvi standalone runtime

ExpoModulesJSI's standalone `JavaScriptRuntime()` path called
`createHermesRuntime()` and included Hermes headers in its SwiftPM XCFramework
build. With Hermes disabled, that helper must use Kahvi's JSI runtime instead.
The patch updates the helper/API name, adds Kahvi's public header search path
and pod dependency, and includes the header in the XCFramework build cache key.

The React Native host runtime is still supplied by the app's
`createJSRuntimeFactory()` override; this standalone path is used only by
callers that explicitly construct a `JavaScriptRuntime` without a host runtime.
