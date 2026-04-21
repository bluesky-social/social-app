import {type ComponentType} from 'react'
import {Pressable, type PressableProps, StyleSheet} from 'react-native'

import {HITSLOP_10} from '#/lib/constants'
import {type Props as IconProps} from '#/components/icons/common'

type Props = {
  icon: ComponentType<IconProps>
  label: string
  onPress?: PressableProps['onPress']
  testID?: string
}

const SIZE = 36
const BG = 'rgba(0, 0, 0, 0.45)'

export function CircleChromeButton({
  icon: Icon,
  label,
  onPress,
  testID,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint=""
      hitSlop={HITSLOP_10}
      onPress={onPress}
      testID={testID}
      style={({pressed}) => [styles.root, pressed && styles.pressed]}>
      <Icon width={20} fill="#fff" />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
})
