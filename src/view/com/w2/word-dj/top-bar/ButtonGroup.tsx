import React from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {TouchableOpacity} from 'react-native'
import {StyleSheet, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'

interface ButtonGroupProps {
  location: 'flex-start' | 'flex-end'
  children: React.ReactNode
}
export const ButtonGroup = ({location, children}: ButtonGroupProps) => {
  return (
    <View style={[styles.buttonGroup, {justifyContent: location}]}>
      {children}
    </View>
  )
}

interface TextButtonProps {
  text: string
  emphasis?: boolean
  disabled?: boolean
  onPress: () => void
}

export const TextButton = ({
  text,
  emphasis,
  disabled,
  onPress,
}: TextButtonProps) => {
  const pal = usePalette(emphasis ? 'primary' : 'default')
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[s.pt5, s.pb5]}
      onPress={onPress}
      disabled={disabled}>
      <Text
        type={emphasis ? 'lg-bold' : 'lg'}
        style={[
          emphasis ? pal.textLight : pal.text,
          disabled ? s.op50 : s.op100,
        ]}>
        {text}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  buttonGroup: {
    flexDirection: 'row',
    flexBasis: 0,
    flex: 1,
    gap: 16,
  },
})
