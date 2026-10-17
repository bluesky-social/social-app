## expo-modules-core Patch

### Android: bitdrift interceptor

Fixes an issue where bitdrift's API stream gets blocked by the Expo interceptor used to power the devtools.

The bitdrift `ApiService/Mux` endpoint is a long-lived gRPC stream, which `shouldParseBody` does not recognise
as a streaming content type (it only skips SSE, RSC, audio and video), so the interceptor tries to peek the body.
Unchanged upstream in 58.0.22 and on expo/expo `main`.

expo-modules-core ships no prebuilt Android AAR (its only prebuilt is the C++ `.so` bundle, which the Kotlin
sources do not affect), so this Kotlin patch always takes effect without a `buildFromSource` entry.
