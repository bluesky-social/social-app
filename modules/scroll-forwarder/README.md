# React Native Scroll Forwarder

A simple module for iOS that updates a `RCTScrollView`'s content offset based on the translation of a
`UIPanGestureRecognizer`.

## Usage

You should have two views: a `ScrollView` (or a `FlatList`, `VirtualizedList`, etc. that uses `RCTScrollView`) and another
view that you want to detect pan on to apply to the `RCTScrollView`.

Next, you need to get the `_nativeTag` of your `ScrollView`, like below:

```tsx
const [scrollViewTag, setScrollViewTag] = React.useState<string>('')

return (
  <ScrollView ref={(ref) => {
    // Note that `_nativeTag` will not be typed, however, it does exist.
    ref.getNativeScrollRef()?._nativeTag
  }}>
    <View>
      <Text>Some children</Text>
    </View>
  </ScrollView>
)
```

You might want to use a `Context` to easily access your `_nativeTag` outside of this view.

Next, wrap the view you're trying to detect gesture on inside of `ScrollForwarder`.

```tsx
return (
  <ScrollForwarder
    scrollViewTag={scrollViewTag}
    onScrollViewRefresh={async () => {}}
    scrollViewRefreshing={isRefreshing}
  >
    <View>
      <Text>Probably a header for a list</Text>
    </View>
  </ScrollForwarder>
)
```

The pan gestures detected on the children of `<ScrollForwarder>` will be applied to the `RCTScrollView` found for the
provided React tag. If no tag is provided, if the tag is invalid, or if the view for the given tag is not of
`RCTScrollView`, the recognizer will be no-op.

You can also pass a refresh function and refreshing state to the forwarder. There are some visual glitches if you rely
on the `ScrollView`'s `RefreshControl` to handle this, so we handle the refreshes ourselves whenever we refresh from the
scroll forwarder.
