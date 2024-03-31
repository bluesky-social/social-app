# RefreshControl Patch

Patching `RCTRefreshControl.mm` temporarily to play an impact haptic on refresh when using iOS 17.4 or higher. Since
17.4, there has been a regression somewhere causing haptics to not play on iOS on refresh. Should monitor for an update
in the RN repo: https://github.com/facebook/react-native/issues/43388