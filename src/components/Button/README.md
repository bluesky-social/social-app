# Button

`Button` is intended to be very flexible and can be used to create consistent
button styles, as seen in the Storybook, or can be used to create custom
buttons with totally independent styles.

## Usage

Typical usage looks like this, where the `variant`, `size`, `color`, and/or
`shape` are defined. Normal usage also should make use of the `ButtonText` and
`ButtonIcon` components so that they inherit styles from the top level props
like `color`.

```tsx
<Button
  label='Typical button'
  onPress={() => {}}
  size='large'
  variant='solid'
  color='primary'
>
  <ButtonIcon icon={Plus} position='left' />
  <ButtonText>Hello world</ButtonText>
</Button>
```

Or:

```tsx
<Button
  label='Typical button'
  onPress={() => {}}
  size='large'
  variant='solid'
  color='primary'
>
  <ButtonText>Hello world</ButtonText>
  <ButtonIcon icon={Plus} position='right' />
</Button>
```

Each of those top-level props props is optional in order to allow for "custom"
buttons, like this:

```tsx
<Button label='Custom button' onPress={() => {}}>
  {({ hovered, focused, pressed, disabled }) => (
    <View style={[
      t.atoms.bg_contrast_25,
      hovered && t.atoms.bg_contrast_50,
    ]}>
      <Text>{disabled ? 'Disabled' : 'Click me!'}</Text>
    </View>
  ))}
</Button>
```

In the custom button case, you have the _option_ to use `ButtonIcon` and
`ButtonText`, but without top-level props like `color`, they serve little
purpose, and it may be perferrable to define your own components for these
purposes.
