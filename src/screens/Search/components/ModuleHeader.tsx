import {View} from 'react-native'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {logger} from '#/logger'
import {
  atoms as a,
  native,
  useGutters,
  useTheme,
  type ViewStyleProp,
} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {sizes as iconSizes} from '#/components/icons/common'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass2'
import {Text, type TextProps} from '#/components/Typography'

export function Container({
  style,
  children,
}: {children: React.ReactNode} & ViewStyleProp) {
  const t = useTheme()
  const gutters = useGutters([0, 'base'])
  return (
    <View
      style={[
        t.atoms.bg,
        a.border_b,
        t.atoms.border_contrast_low,
        a.flex_row,
        a.align_center,
        gutters,
        a.pt_2xs,
        a.pb_sm,
        a.gap_sm,
        style,
      ]}>
      {children}
    </View>
  )
}

export function Icon({
  icon: Comp,
  size = 'lg',
}: Pick<React.ComponentProps<typeof ButtonIcon>, 'icon' | 'size'>) {
  const iconSize = iconSizes[size]

  return (
    <View style={[a.z_20, {width: iconSize, height: iconSize, marginLeft: -2}]}>
      <Comp width={iconSize} />
    </View>
  )
}

export function TitleText({style, ...props}: TextProps) {
  return <Text style={[a.font_bold, a.flex_1, a.text_xl, style]} {...props} />
}

export function SearchButton({
  label,
  metricsTag,
  onPress,
}: {
  label: string
  metricsTag: 'suggestedAccounts' | 'suggestedFeeds'
  onPress?: () => void
}) {
  return (
    <Button
      label={label}
      size="small"
      variant="ghost"
      color="secondary"
      shape="round"
      PressableComponent={native(PressableScale)}
      onPress={() => {
        logger.metric('explore:module:searchButtonPress', {module: metricsTag})
        onPress?.()
      }}>
      <ButtonIcon icon={SearchIcon} size="lg" />
    </Button>
  )
}
