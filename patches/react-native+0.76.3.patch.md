# ***This second part of this patch is load bearing, do not remove.***

## RefreshControl Patch - iOS 17.4 Haptic Regression

Patching `RCTRefreshControl.mm` temporarily to play an impact haptic on refresh when using iOS 17.4 or higher. Since
17.4, there has been a regression somewhere causing haptics to not play on iOS on refresh. Should monitor for an update
in the RN repo: https://github.com/facebook/react-native/issues/43388

## RefreshControl Path - ScrollForwarder

Patching `RCTRefreshControl.m` and `RCTRefreshControl.h` to add a new `forwarderBeginRefreshing` method to the class.
This method is used by `ExpoScrollForwarder` to initiate a refresh of the underlying `UIScrollView` from inside that
module.


## TextInput Patch - `selectTextOnFocus` fix

Patching `RCTBaseTextInputView.m` to fix an issue where `selectTextOnFocus` does not work as expected on iOS 17. This
patch _only_ fixes the Paper version of `TextInput`. If we migrate to Fabric and the fix has not been made upstream,
we can apply the same fix. See https://github.com/facebook/react-native/pull/44307.
