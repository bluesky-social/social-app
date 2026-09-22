import {
  type StyleProp,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {
  Button,
  ButtonIcon,
  type ButtonProps,
  ButtonText,
} from '#/components/Button'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Text as TypographyText, type TextProps} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

const AVATAR_SIZE = 36
const AVATAR_BADGE_SIZE = 20
const AVATAR_CONTAINER_SIZE = 42
const LIST_AVATAR_SIZE = 24

export function Root({
  children,
  unread = false,
  style,
  ...rest
}: ViewProps & {
  unread?: boolean
}) {
  const t = useTheme()

  return (
    <View
      {...rest}
      style={[
        a.flex_row,
        a.align_start,
        a.gap_md,
        a.px_lg,
        a.py_md,
        unread && {
          backgroundColor: t.palette.primary_25,
        },
        style,
      ]}>
      {children}
    </View>
  )
}

export function SectionHeader({children, style, ...rest}: ViewProps) {
  return (
    <View {...rest} style={[a.px_lg, a.pt_md, a.pb_sm, style]}>
      {children}
    </View>
  )
}

export function SectionHeaderText({style, ...rest}: TextProps) {
  return <TypographyText {...rest} style={[a.text_md, a.font_bold, style]} />
}

export function Avatar({
  profile,
  color,
  icon: Icon,
}: {
  profile: bsky.profile.AnyProfileView
  color: string
  icon: React.ComponentType<SVGIconProps>
}) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  const moderation = moderationOpts
    ? moderateProfile(profile, moderationOpts).ui('avatar')
    : undefined

  return (
    <View
      style={[
        a.relative,
        a.flex_shrink_0,
        {
          width: AVATAR_CONTAINER_SIZE,
          height: AVATAR_CONTAINER_SIZE,
        },
      ]}>
      <PreviewableUserAvatar
        profile={profile}
        moderation={moderation}
        size={AVATAR_SIZE}
        hideLiveBadge
      />
      <View
        accessible={false}
        pointerEvents="none"
        style={[
          a.absolute,
          a.right_0,
          a.bottom_0,
          a.align_center,
          a.justify_center,
          a.rounded_full,
          {
            width: AVATAR_BADGE_SIZE,
            height: AVATAR_BADGE_SIZE,
            backgroundColor: color,
          },
        ]}>
        <Icon size="xs" fill={t.palette.white} />
      </View>
    </View>
  )
}

export function AvatarList({
  profiles,
  extraCount = 0,
  style,
}: {
  profiles: bsky.profile.AnyProfileView[]
  extraCount?: number
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()

  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm, style]}>
      {profiles.map(profile => (
        <PreviewableUserAvatar
          key={profile.did}
          profile={profile}
          moderation={
            moderationOpts
              ? moderateProfile(profile, moderationOpts).ui('avatar')
              : undefined
          }
          size={LIST_AVATAR_SIZE}
          hideLiveBadge
        />
      ))}
      {extraCount > 0 && (
        <View
          style={[
            a.align_center,
            a.justify_center,
            a.rounded_full,
            t.atoms.bg_contrast_50,
            a.px_xs,
            {
              minWidth: LIST_AVATAR_SIZE,
              height: LIST_AVATAR_SIZE,
            },
          ]}>
          <TypographyText
            style={[a.text_xs, t.atoms.text_contrast_medium]}
            maxFontSizeMultiplier={1}>
            +{extraCount}
          </TypographyText>
        </View>
      )}
    </View>
  )
}

export function Content({children, style, ...rest}: ViewProps) {
  return (
    <View {...rest} style={[a.flex_1, a.gap_2xs, {minWidth: 0}, style]}>
      {children}
    </View>
  )
}

export function Text({style, emoji = true, ...rest}: TextProps) {
  return <TypographyText {...rest} emoji={emoji} style={[a.text_md, style]} />
}

export function Strong({style, emoji = true, ...rest}: TextProps) {
  return (
    <TypographyText {...rest} emoji={emoji} style={[a.font_semi_bold, style]} />
  )
}

export function SubjectText({style, emoji = true, ...rest}: TextProps) {
  const t = useTheme()

  return (
    <TypographyText
      {...rest}
      emoji={emoji}
      style={[a.text_md, t.atoms.text_contrast_high, style]}
    />
  )
}

export function Timestamp({style, ...rest}: TextProps) {
  const t = useTheme()

  return (
    <TypographyText
      {...rest}
      style={[a.text_sm, t.atoms.text_contrast_medium, style]}
    />
  )
}

export function Footer({children, style, ...rest}: ViewProps) {
  return (
    <View
      {...rest}
      style={[a.flex_row, a.align_center, a.justify_between, a.pt_xs, style]}>
      {children}
    </View>
  )
}

export function Actions({children, style, ...rest}: ViewProps) {
  return (
    <View {...rest} style={[a.flex_row, a.align_center, a.gap_sm, style]}>
      {children}
    </View>
  )
}

export function ActionSlot({children, style, ...rest}: ViewProps) {
  return (
    <View {...rest} style={[a.flex_row, a.align_center, a.ml_auto, style]}>
      {children}
    </View>
  )
}

export function Action({
  icon,
  text,
  ...rest
}: Omit<ButtonProps, 'children' | 'color' | 'shape' | 'size'> & {
  icon: React.ComponentType<SVGIconProps>
  text: string
}) {
  return (
    <Button {...rest} color="secondary" size="tiny">
      <ButtonIcon icon={icon} />
      <ButtonText>{text}</ButtonText>
    </Button>
  )
}
