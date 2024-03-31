# React Native UITextView

Drop in replacement for `<Text>` that renders a `UITextView`, support selection and native translation features on iOS.

## Installation

In this project, no installation is required. The pod will be installed automatically during a `pod install`.

In another project, clone the repo and copy the `modules/react-native-ui-text-view` directory to your own project
directory. Afterward, run `pod install`.

## Usage

Replace the outermost `<Text>` with `<UITextView>`. Styles and press events should be handled the same way they would
with `<Text>`. Both `<UITextView>` and `<Text>` are supported as children of the root `<UITextView>`.

## Technical

React Native's `Text` component allows for "infinite" nesting of further `Text` components. To make a true "drop-in",
we want to do the same thing.

To achieve this, we first need to handle determining if we are dealing with an ancestor or root `UITextView` component.
We can implement similar logic to the `Text` component [see Text.js](https://github.com/facebook/react-native/blob/7f2529de7bc9ab1617eaf571e950d0717c3102a6/packages/react-native/Libraries/Text/Text.js).

We create a context that contains a boolean to tell us if we have already rendered the root `UITextView`. We also store
the root styles so that we can apply those styles if the ancestor `UITextView`s have not overwritten those styles.

All of our children are placed into `RNUITextView`, which is the main native view that will display the iOS `UITextView`.

We next map each child into the view. We have to be careful here to check if the child's `children` prop is a string. If
it is, that means we have encountered what was once an RN `Text` component. RN doesn't let us pass plain text as
children outside of `Text`, so we instead just pass the text into the `text` prop on `RNUITextViewChild`. We continue 
down the tree, until we run out of children.

On the native side, we make use of the shadow view to calculate text container dimensions before the views are mounted.
We cannot simply set the `UITextView` text first, since React will not have properly measured the layout before this
occurs.


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
