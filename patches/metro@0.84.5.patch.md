# metro+0.84.5.patch

Required by [Worklets Bundle Mode](https://docs.swmansion.com/react-native-worklets/docs/bundleMode/).

Bundle Mode isolates each worklet in a separate module, generated on the fly
into `react-native-worklets/.worklets`. Metro doesn't index these modules in
time, so the patch makes `DependencyGraph.getOrComputeSha1` return a fresh
SHA-1 for files in that directory instead of looking them up in the file map.

See [Enable seamless Metro bundling](https://docs.swmansion.com/react-native-worklets/docs/bundleMode/setup/#enable-seamless-metro-bundling)
and the [upstream patches](https://github.com/software-mansion/react-native-reanimated/tree/main/packages/react-native-worklets/bundleMode/patches).
