# Expo Selectable Text

This module creates a wrapper `<SelectableText>` for React Native's `<Text>` component. Text components are
parsed and rendered using UITextView instead of UILabel, allowing for text selection.

## Usage

In most cases, you can simply use like so:

```tsx
<SelectableText selectable style={{color: '#000000', fontSize: 20}}>
  Here is some text.
</SelectableText>
```

You may also have nested `<Text>` components inside the `<SelectableText>` block. For example:
```tsx
<SelectableText selectable style={{color: '#000000', fontSize: 20}}>
  Here is some text. <Text style={{color: 'lightblue'}} onPress={() => {Alert.alert('Press!')}}>And this is a link.</Text>
</SelectableText>
```

Note that nested components should always use `<Text>` and not `<SelectableText>`. Only the outermost `<Text>` should
be replaced with `<SelectableText>`.

Like `<Text>` styles given to `<SelectableText>` will be passed to each child `<Text>` component unless specified in the
child's style. All the base [React Native Text styles](https://reactnative.dev/docs/text-style-props) are supported
(with the same iOS limitations, of course).

## Installation

Using inside of this project should not require any installation. The podfile should automatically find and locate the
podspec inside of this directory.

## Technical

Whenever we use the SelectableText component, we then loop over each of the children (or just the text if the child
is typeof Text). We create "segments" of text based on this and encode them to JSON* to pass to the native side.

/* Expo Modules doesn't currently support passing an array over the bridge, but even if it did, it would be parsing
sending JSON over the bridge anyway, so this is not an issue. I want to make sure this is the case (on expo support) but
regardless there's no real perf concern.

The native side renders a *single* UITextView and adds each of the text segments to the view. Using NSAttributedStrings,
we can add the styles for each segment individually (falling back to the root styles).

There's a few ways we could go about handling presses. For one, we could create fake URLs to add to each
NSAttributedString and handle their presses. However, this has a few downsides:
1. We can't support long presses this way without adding an additional gesture recognizer.
2. The presses actually are not "instant". The default gesture for these links requires a slighly longer press than just
a tap, so we'd end up needing to modify this recognizer anyway.

As such, we create a gesture recognizer for the entire UITextView. The recognizer determines the text at the position of
the press, determines which segment it is, and sends an `onTextPress` event to the JS side along with the index of the
segment. On the JS side, we have our array of segments (that included the `onPress` event from the `Text`/`SelectableText`)
that we can now call based on the index from the native event.

We can't reliably modify the size of the view's container on the native side (*don't take my word for this, I might be -
and likely am - wrong about this). Therefore, we send an `onTextLayout` event to the JS thread that we can use to resize
the container's height based on the required height to display the text. This only gets called once per text update.
