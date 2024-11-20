import {useCallback, useState} from 'react'
import {StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native'
// @ts-ignore types not available -prf
import {unstable_createElement} from 'react-native-web'

import {usePalette} from '#/lib/hooks/usePalette'

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
  const pal = usePalette('default')
  const [value, setValue] = useState(toDateInputValue(props.value))

  const onChangeInternal = useCallback(
    (v: Date) => {
      if (!v) {
        return
      }
      setValue(toDateInputValue(v))
      props.onChange(v)
    },
    [setValue, props],
  )

  return (
    <View style={[pal.borderDark, styles.container]}>
      {unstable_createElement('input', {
        type: 'date',
        testID: props.testID,
        value,
        onChange: (e: any) => onChangeInternal(e.currentTarget.valueAsDate),
        style: [pal.text, pal.view, pal.border, styles.textInput],
        placeholderTextColor: pal.colors.textLight,
        accessibilityLabel: props.accessibilityLabel,
        accessibilityHint: props.accessibilityHint,
        accessibilityLabelledBy: props.accessibilityLabelledBy,
      })}
    </View>
  )
}

// we need the date in the form yyyy-MM-dd to pass to the input
function toDateInputValue(d: Date): string {
  return d.toISOString().split('T')[0]
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderRadius: 10,
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
    borderWidth: 0,
  },
})
