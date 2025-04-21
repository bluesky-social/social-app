import {useMemo} from 'react'
import {View} from 'react-native'
import {type AppBskyFeedDefs, AtUri} from '@atproto/api'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {makeCustomFeedLink} from '#/lib/routes/links'
import {logger} from '#/logger'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native, useTheme, type ViewStyleProp} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as FeedCard from '#/components/FeedCard'
import {sizes as iconSizes} from '#/components/icons/common'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass2'
import {Link} from '#/components/Link'
import {Text, type TextProps} from '#/components/Typography'

export function Container({
  style,
  children,
  bottomBorder,
}: {
  children: React.ReactNode
  bottomBorder?: boolean
} & ViewStyleProp) {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.px_lg,
        a.pt_2xl,
        a.pb_md,
        a.gap_sm,
        t.atoms.bg,
        bottomBorder && [a.border_b, t.atoms.border_contrast_low],
        style,
      ]}>
      {children}
    </View>
  )
}

export function FeedLink({
  feed,
  children,
}: {
  feed: AppBskyFeedDefs.GeneratorView
  children?: React.ReactNode
}) {
  const t = useTheme()
  const {host: did, rkey} = useMemo(() => new AtUri(feed.uri), [feed.uri])
  return (
    <Link
      to={makeCustomFeedLink(did, rkey)}
      label={feed.displayName}
      style={[a.flex_1]}>
      {({focused, hovered, pressed}) => (
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            {gap: 10},
            a.rounded_md,
            a.p_xs,
            {marginLeft: -6},
            (focused || hovered || pressed) && t.atoms.bg_contrast_25,
          ]}>
          {children}
        </View>
      )}
    </Link>
  )
}

export function FeedAvatar({feed}: {feed: AppBskyFeedDefs.GeneratorView}) {
  return <UserAvatar type="algo" size={38} avatar={feed.avatar} />
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
  return (
    <Text style={[a.font_bold, a.flex_1, a.text_xl, style]} emoji {...props} />
  )
}

export function SubtitleText({style, ...props}: TextProps) {
  const t = useTheme()
  return (
    <Text
      style={[
        t.atoms.text_contrast_medium,
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

export function PinButton({feed}: {feed: AppBskyFeedDefs.GeneratorView}) {
  return (
    <View style={[a.z_20, {marginRight: -6}]}>
      <FeedCard.SaveButton
        pin
        view={feed}
        size="large"
        color="secondary"
        variant="ghost"
        shape="square"
        text={false}
      />
    </View>
  )
}
