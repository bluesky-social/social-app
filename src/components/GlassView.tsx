import {type StyleProp, View, type ViewStyle} from 'react-native'
import {
  GlassView as ExpoGlassView,
  type GlassViewProps as ExpoGlassViewProps,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect'

import {useTheme} from '#/alf'

export const IS_GLASS_AVAILABLE =
  isLiquidGlassAvailable() && isGlassEffectAPIAvailable()

/**
 * Liquid Glass View that uses `expo-glass-effect`
 *
 * If unavailable, falls back to a regular `View`. Use `fallbackStyle` to customize the fallback appearance.
 */
export const GlassView = IS_GLASS_AVAILABLE ? InnerGlassView : FallbackView

export type GlassViewProps = ExpoGlassViewProps & {
  fallbackStyle?: StyleProp<ViewStyle>
}

function InnerGlassView({
  fallbackStyle: _fallbackStyle,
  ...props
}: GlassViewProps) {
  const t = useTheme()
  return <ExpoGlassView colorScheme={t.scheme} {...props} />
}

function FallbackView({fallbackStyle, style, ...props}: GlassViewProps) {
  return <View style={[fallbackStyle, style]} {...props} />
}
