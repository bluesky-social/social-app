import React from 'react'
import {StyleSheet, TextInput as RNTextInput, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'

export function TextInput({
  testID,
  icon,
  value,
  placeholder,
  editable,
  secureTextEntry,
  onChange,
}: {
  testID?: string
  icon: IconProp
  value: string
  placeholder: string
  editable: boolean
  secureTextEntry?: boolean
  onChange: (v: string) => void
}) {
  const theme = useTheme()
  const pal = usePalette('default')
  return (
    <View style={[pal.border, styles.container]}>
      <FontAwesomeIcon icon={icon} style={[pal.textLight, styles.icon]} />
      <RNTextInput
        testID={testID}
        style={[pal.text, styles.textInput]}
        placeholder={placeholder}
        placeholderTextColor={pal.colors.textLight}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardAppearance={theme.colorScheme}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={v => onChange(v)}
        editable={editable}
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
