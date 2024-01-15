# Expo Selectable Text

This module is a drop-in replacement for React Native's `Text` component. Simply replace `<Text>` with `<UITextView>`.

## Usage

Note that nested components should always use `<Text>` and not `<SelectableText>`. Only the outermost `<Text>` should
be replaced with `<SelectableText>`.

Like `<Text>` styles given to `<SelectableText>` will be passed to each child `<Text>` component unless specified in the
child's style. All the base [React Native Text styles](https://reactnative.dev/docs/text-style-props) are supported
(with the same iOS limitations, of course).

## Installation

Using inside of this project should not require any installation. The podfile should automatically find and locate the
podspec inside of this directory.

## Technical

React Native's `Text` component allows for "infinite" nesting of further `Text` components. To make a true "drop-in",
we want to do the same thing.

To achieve this, we first need to handle determining if we are dealing with an ancestor or root `UITextView` component.
We can implement similar logic to the `Text` component [see Text.js](https://github.com/facebook/react-native/blob/7f2529de7bc9ab1617eaf571e950d0717c3102a6/packages/react-native/Libraries/Text/Text.js).

We create a context that contains a boolean to tell us if we have already rendered the root `UITextView`. We also store
the root styles so that we can apply those styles if the ancestor `UITextView`s have not overwritten those styles.

All of our children are placed into `ExpoUITextViewRoot`, which is the main native view that will display the native
`UITextView`. There are no styles that need to be applied to this view, as we will be updating the size of the view
dynamically based on the text size.

We next map each child into the view. We have to be careful here to check if the child's `children` prop is a string. If
it is, that means we have encountered what was once an RN `Text` component. RN doesn't let us pass plain text as
children outside of `Text`, so we instead just pass the text into the `text` prop on the `ExpoUITextViewChild` native
view. We continue down the tree, until we run out of children.

On the native side, we have two view types: `ExpoUITextView` and `ExpoUITextViewChild`. Again, the `ExpoUITextView`
contains the `UITextView`, and the `ExpoUITextViewChild` views are invisible, only allowing us to access their props.

Each time a new subview is added to the root view, we check its type. If it is of `ExpoUITextViewChild`, we add it to
our subviews. We prefer to keep these "rendered" in as subviews so that React can manage their order. This also keeps
them stateful. Again though, these views are not visible and do not actually render a view.

We also update the `UITextView`'s text each time new subviews are added. We create a `NSAttributedString` that contains
the text of each child and applies the styles to the string. There is near parity to base RN `TextStyle`, however there
may be a few discrepancies. As I find those I'll correct them.

As for `Text` props, the following props are implemented:

- All accessibility props
- `allowFontScaling`
- `adjustsFontSizeToFit`
- `ellipsizeMode`
- `numberOfLines`
- `onLayout`
- `onPress`
- `onTextLayout`
- `selectable`

All `ViewStyle` props will apply to the root `UITextView`. Individual children will respect these `TextStyle` styles:

- `color`
- `fontSize`
- `fontStyle`
- `fontWeight`
- `fontVariant`
- `letterSpacing`
- `lineHeight`
- `textDecorationLine`
