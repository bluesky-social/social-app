import {ActivityIndicator, type ColorValue} from 'react-native'

import {atoms as a, useTheme, type ViewStyleProp} from '#/alf'

export interface ActivityIndicatorProps extends ViewStyleProp {
  size?: 'small' | 'large' | number
  color?: string | ColorValue
  animating?: boolean
  hidesWhenStopped?: boolean
}

export function CustomActivityIndicator({
  size = 'small',
  color,
  animating = true,
  hidesWhenStopped = true,
  style,
}: ActivityIndicatorProps) {
  const t = useTheme()

  return (
    <ActivityIndicator
      size={size}
      color={color || t.palette.primary_500}
      animating={animating}
      hidesWhenStopped={hidesWhenStopped}
      style={[a.align_center, a.justify_center, style]}
    />
  )
}
