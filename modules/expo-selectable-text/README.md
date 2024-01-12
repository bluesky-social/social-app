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
