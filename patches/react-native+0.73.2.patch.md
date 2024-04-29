# ***This second part of this patch is load bearing, do not remove.***

## RefreshControl Patch - iOS 17.4 Haptic Regression

Patching `RCTRefreshControl.mm` temporarily to play an impact haptic on refresh when using iOS 17.4 or higher. Since
17.4, there has been a regression somewhere causing haptics to not play on iOS on refresh. Should monitor for an update
in the RN repo: https://github.com/facebook/react-native/issues/43388

## RefreshControl Path - ScrollForwarder

Patching `RCTRefreshControl.m` and `RCTRefreshControl.h` to add a new `forwarderBeginRefreshing` method to the class.
This method is used by `ExpoScrollForwarder` to initiate a refresh of the underlying `UIScrollView` from inside that
module.


## RCTBaseTextInputView Patch - Move `selectAll` call to `reactFocus` method

Patching `RCTBaseTextInputView.m` to move the `selectAll` call to the `reactFocus` method. Currently, `selectAll` is
called in `textInputDidBeginEditing`. This would be fine, however, once `reactFocus` is later called (this happens every
time the text field is focused), the selection is reset/removed. The previous solution was to do this:

```tsx
<TextInput
    onFocus={() => {
      if (Platform.OS === 'ios') {
        textInput.current?.setSelection(0, searchText.length)
      }
    }}
/>
```

This likely works, because by the time the `onFocus` event is called, `reactFocus` has also already been called. However
this is probably unreliable.
