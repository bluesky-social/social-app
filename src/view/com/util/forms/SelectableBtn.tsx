import React from 'react'
import {Pressable, ViewStyle, StyleProp, StyleSheet} from 'react-native'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

interface SelectableBtnProps {
  testID?: string
  selected: boolean
  label: string
  left?: boolean
  right?: boolean
  onSelect: () => void
  accessibilityHint?: string
  style?: StyleProp<ViewStyle>
}

export function SelectableBtn({
  testID,
  selected,
  label,
  left,
  right,
  onSelect,
  accessibilityHint,
  style,
}: SelectableBtnProps) {
  const pal = usePalette('default')
  const palPrimary = usePalette('inverted')
  const needsWidthStyles = !style || !('width' in style || 'flex' in style)
  const {isMobile} = useWebMediaQueries()
  return (
    <Pressable
      testID={testID}
      style={[
        styles.btn,
        needsWidthStyles && {
          flex: isMobile ? 1 : undefined,
          width: !isMobile ? 100 : undefined,
        },
        left && styles.btnLeft,
        right && styles.btnRight,
        pal.border,
        selected ? palPrimary.view : pal.view,
        style,
      ]}
      onPress={onSelect}
      role="button"
      aria-label={label}
      accessibilityHint={accessibilityHint}>
      <Text style={selected ? palPrimary.text : pal.text}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderLeftWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  btnLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderLeftWidth: 1,
  },
  btnRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
})
