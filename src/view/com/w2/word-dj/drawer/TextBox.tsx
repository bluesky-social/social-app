import React, {ForwardedRef} from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextInput,
  TextInputProps,
} from 'react-native'
import {useTheme} from 'lib/ThemeContext'

interface Props extends TextInputProps {
  style?: StyleProp<ViewStyle>
  onCommit?: (text: string) => void
}

export const TextBox = React.forwardRef(function TextBox(
  {style, ...props}: Props,
  ref: ForwardedRef<TextInput>,
) {
  const pal = usePalette('default')
  const palPrimary = usePalette('primary')
  const theme = useTheme()

  return (
    <View style={[styles.container, style, pal.view, palPrimary.borderDark]}>
      <TextInput
        ref={ref}
        style={[pal.text, styles.textInput, theme.typography.lg]}
        placeholderTextColor={pal.colors.textLight}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardAppearance={theme.colorScheme}
        {...props}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 17,
    borderWidth: 2,
  },
  textInput: {},
})
