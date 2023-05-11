import React, {useState, useCallback} from 'react'
import {
  StyleProp,
  StyleSheet,
  TextInput as RNTextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'

interface Props {
  testID?: string
  value: Date
  onChange: (date: Date) => void
  buttonType?: string
  buttonStyle?: StyleProp<ViewStyle>
  buttonLabelType?: string
  buttonLabelStyle?: StyleProp<TextStyle>
  accessibilityLabel: string
  accessibilityHint: string
  accessibilityLabelledBy?: string
}

export function DateInput(props: Props) {
  const theme = useTheme()
  const pal = usePalette('default')
  const palError = usePalette('error')
  const [value, setValue] = useState(props.value.toLocaleDateString())
  const [isValid, setIsValid] = useState(true)

  const onChangeInternal = useCallback(
    (v: string) => {
      setValue(v)
      const d = new Date(v)
      if (!isNaN(Number(d))) {
        setIsValid(true)
        props.onChange(d)
      } else {
        setIsValid(false)
      }
    },
    [setValue, setIsValid, props],
  )

  return (
    <View style={[isValid ? pal.border : palError.border, styles.container]}>
      <FontAwesomeIcon
        icon={['far', 'calendar']}
        style={[pal.textLight, styles.icon]}
      />
      <RNTextInput
        testID={props.testID}
        style={[pal.text, styles.textInput]}
        placeholderTextColor={pal.colors.textLight}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardAppearance={theme.colorScheme}
        onChangeText={v => onChangeInternal(v)}
        value={value}
        accessibilityLabel={props.accessibilityLabel}
        accessibilityHint={props.accessibilityHint}
        accessibilityLabelledBy={props.accessibilityLabelledBy}
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
