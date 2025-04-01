import {View} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {logger} from '#/logger'
import {UserAvatar} from '#/view/com/util/UserAvatar'
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
import {Pin_Stroke2_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
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
        gutters,
        a.flex_row,
        a.align_center,
        a.pt_2xl,
        a.pb_md,
        a.gap_sm,
        t.atoms.bg,
        style,
      ]}>
      {children}
    </View>
  )
}

export function FeedAvatar({feed}: {feed: AppBskyFeedDefs.GeneratorView}) {
  return (
    <View style={[a.z_20, {marginLeft: -2}, a.mr_xs]}>
      <UserAvatar type="algo" size={42} avatar={feed.avatar} />
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

export function SubtitleText({style, ...props}: TextProps) {
  const t = useTheme()
  return (
    <Text
      style={[
        t.atoms.text_contrast_low,
        a.leading_tight,
        a.flex_1,
        a.text_sm,
        style,
      ]}
      {...props}
    />
  )
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
        logger.metric(
          'explore:module:searchButtonPress',
          {module: metricsTag},
          {statsig: true},
        )
        onPress?.()
      }}
      style={[
        {
          right: -4,
        },
      ]}>
      <ButtonIcon icon={SearchIcon} size="lg" />
    </Button>
  )
}

export function PinButton({}: {feed: AppBskyFeedDefs.GeneratorView}) {
  const {_} = useLingui()
  return (
    <View style={[a.z_20, {marginRight: -2}]}>
      <Button
        label={_(msg`Pin Feed`)}
        size="small"
        variant="ghost"
        color="secondary">
        <ButtonIcon icon={PinIcon} size="lg" />
      </Button>
    </View>
  )
}
