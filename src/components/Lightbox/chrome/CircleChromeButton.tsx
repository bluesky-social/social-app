import {type ComponentType} from 'react'
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  type TextStyle,
} from 'react-native'
import {BlurView} from 'expo-blur'

import {HITSLOP_10} from '#/lib/constants'
import {type Props as IconProps} from '#/components/icons/common'

type Props = {
  icon: ComponentType<IconProps>
  iconStyle?: StyleProp<TextStyle>
  label: string
  onPress?: PressableProps['onPress']
  testID?: string
}

const SIZE = 44
const RADIUS = 24
const ICON = 24

export function CircleChromeButton({
  icon: Icon,
  iconStyle,
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
      <BlurView intensity={20} tint="dark" style={styles.inner}>
        <Icon width={ICON} fill="#fff" style={iconStyle} />
      </BlurView>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: {
    width: SIZE,
    height: SIZE,
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pressed: {
    opacity: 0.85,
  },
})
