import {ComponentProps} from 'react'
import {StyleSheet, TextInput as RNTextInput, View} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import {usePalette} from '#/lib/hooks/usePalette'
import {useTheme} from '#/lib/ThemeContext'

interface Props extends Omit<ComponentProps<typeof RNTextInput>, 'onChange'> {
  testID?: string
  icon: IconProp
  onChange: (v: string) => void
}

export function TextInput({testID, icon, onChange, ...props}: Props) {
  const theme = useTheme()
  const pal = usePalette('default')
  return (
    <View style={[pal.border, styles.container]}>
      <FontAwesomeIcon icon={icon} style={[pal.textLight, styles.icon]} />
      <RNTextInput
        testID={testID}
        style={[pal.text, styles.textInput]}
        placeholderTextColor={pal.colors.textLight}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardAppearance={theme.colorScheme}
        onChangeText={v => onChange(v)}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  icon: {
    marginLeft: 10,
  },
  textInput: {
    flex: 1,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 17,
    letterSpacing: 0.25,
    fontWeight: '400',
    borderRadius: 10,
  },
})
