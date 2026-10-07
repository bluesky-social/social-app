# metro-runtime+0.84.5.patch

Required by [Worklets Bundle Mode](https://docs.swmansion.com/react-native-worklets/docs/bundleMode/).

Without this patch, Fast Refresh updates only reach the RN Runtime, so Worklet
Runtimes don't know about new or changed worklets. The patch makes
`HMRClient` forward each module update to Worklet Runtimes via
`__workletsModuleProxy.propagateModuleUpdate` before evaluating it.

See [Enable fast refresh on Worklet Runtimes](https://docs.swmansion.com/react-native-worklets/docs/bundleMode/setup/#enable-fast-refresh-on-worklet-runtimes)
and the [upstream patches](https://github.com/software-mansion/react-native-reanimated/tree/main/packages/react-native-worklets/bundleMode/patches).
