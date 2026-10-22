## UIManager.cpp Patch - Fabric focus navigation use-after-free

Fixes Sentry issue APP-T4H9: a SIGSEGV in
`FabricUIManagerBinding::findNextFocusableElement` during focus navigation.

React Native 0.86 contains the safe implementation behind
`fixFindShadowNodeByTagRaceCondition`, but the public default is false. The
fallback captures a raw root shadow-node pointer in `tryCommit` and dereferences
it after the lock is released, allowing a concurrent commit or surface stop to
free the node first. This backports the final upstream implementation, which
holds the current revision's `shared_ptr` for the entire traversal.

**TODO: Remove after bumping React Native to a release containing
facebook/react-native#56850.**
