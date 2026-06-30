## expo-modules-core Patch

This patch contains two unrelated fixes:

### Android: bitdrift interceptor

Fixes an issue where bitdrift's API stream gets blocked by the Expo interceptor used to power the devtools.

### iOS: Hermes startup race in `ExpoBridgeModule.setBridge:`

On the legacy bridge (old architecture, where `RCTRuntimeExecutor.h` is
absent), `setBridge:` installed the Expo runtime synchronously on whatever
thread called it - typically the main thread, since RN's lazy module-load
path ignores `+requiresMainQueueSetup`. The `_runtime.didSet` then ran
`prepareRuntime()` (JSI mutations) on the main thread while the JS thread was
concurrently inside `JSIExecutor::initializeRuntime()`. Two threads mutating
the same Hermes runtime corrupted Hades GC, producing intermittent
`EXC_BAD_ACCESS` launch crashes (e.g. `HadesGC::writeBarrierSlow`,
`prepareRuntime` / `bindNativePerformanceNow`).

The fix hops the runtime install onto `RCTJSThread` so all JSI mutation is
serialized on the JS thread. This backports the upstream fix discussed in
expo/expo#45374; the racy `ExpoBridgeModule` is removed entirely in SDK 55+
(expo/expo#44351), so this patch can be dropped on that upgrade.

Refs: expo/expo#43003, expo/expo#45374, expo/expo#44351
