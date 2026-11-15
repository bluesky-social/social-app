# metro+0.87.1.patch

Required by [Worklets Bundle Mode](https://docs.swmansion.com/react-native-worklets/docs/bundleMode/).

Bundle Mode isolates each worklet in a separate module, generated on the fly
into `react-native-worklets/.worklets`. Metro doesn't index these modules in
time, so the patch makes `DependencyGraph.getOrComputeSha1` return a fresh
SHA-1 for files in that directory instead of looking them up in the file map.

This is identical to the upstream `metro+0.87.1.patch`. Metro 0.87 renamed the
`path` import in `DependencyGraph.js` to `_nodePath` (`node:path`), so the
0.84 patch no longer applies as-is.

Expo SDK 58 swaps Metro's file map for `@expo/metro-file-map` (via
`createFileMap-fork.js` in `@expo/cli`), but `DependencyGraph` itself is still
Metro's, so this hook still runs before the file map is consulted.

See [Enable seamless Metro bundling](https://docs.swmansion.com/react-native-worklets/docs/bundleMode/setup/#enable-seamless-metro-bundling)
and the [upstream patches](https://github.com/software-mansion/react-native-reanimated/tree/main/packages/react-native-worklets/bundleMode/patches).
