import {useMemo} from 'react'
import {View} from 'react-native'
import {BSKY_LABELER_DID, type ModerationCause} from '@atproto/api'
import {Trans} from '@lingui/react/macro'

import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, type ViewStyleProp} from '#/alf'
import {Button} from '#/components/Button'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'
import {Text} from '#/components/Typography'

export type AppModerationCause =
  | ModerationCause
  | {
      type: 'reply-hidden'
      source: {type: 'user'; did: string}
      priority: 6
      downgraded?: boolean
    }

export type CommonProps = {
  size?: 'sm' | 'lg'
}

export function Row({
  children,
  style,
  size = 'sm',
}: {children: React.ReactNode | React.ReactNode[]} & CommonProps &
  ViewStyleProp) {
  const styles = useMemo(() => {
    switch (size) {
      case 'lg':
        return [{gap: 5}]
      case 'sm':
      default:
        return [{gap: 3}]
    }
  }, [size])
  return (
    <View style={[a.flex_row, a.flex_wrap, a.gap_xs, styles, style]}>
      {children}
    </View>
  )
}

export type LabelProps = {
  cause: AppModerationCause
  disableDetailsDialog?: boolean
  noBg?: boolean
} & CommonProps

export function Label({
  cause,
  size = 'sm',
  disableDetailsDialog,
  noBg,
}: LabelProps) {
  const t = useTheme()
  const control = useModerationDetailsDialogControl()
  const desc = useModerationCauseDescription(cause)
  const isLabeler = Boolean(desc.sourceType && desc.sourceDid)
  const isBlueskyLabel =
    desc.sourceType === 'labeler' && desc.sourceDid === BSKY_LABELER_DID
  const avi = size === 'lg' ? 16 : 12

  return (
    <>
      <LabelBase
        label={desc.name}
        size={size}
        noBg={noBg}
        disabled={disableDetailsDialog}
        onPress={() => control.open()}
        icon={
          isBlueskyLabel || !isLabeler ? (
            <desc.icon width={avi} fill={t.atoms.text_contrast_medium.color} />
          ) : (
            <UserAvatar avatar={desc.sourceAvi} type="user" size={avi} />
          )
        }
      />

      {!disableDetailsDialog && (
        <ModerationDetailsDialog control={control} modcause={cause} />
      )}
    </>
  )
}

export type LabelBaseProps = {
  label: string
  onPress: () => void
  disabled?: boolean
  noBg?: boolean
  icon?: React.ReactNode
} & CommonProps

export function LabelBase({
  label,
  onPress,
  disabled,
  size = 'sm',
  noBg,
  icon,
}: LabelBaseProps) {
  const t = useTheme()

  const {outer, text} = useMemo(() => {
    switch (size) {
      case 'lg': {
        return {
          outer: [
            t.atoms.bg_contrast_25,
            {
              gap: 5,
              paddingHorizontal: 5,
              paddingVertical: 5,
            },
          ],
          text: [a.text_sm],
        }
      }
      case 'sm':
      default: {
        return {
          outer: [
            !noBg && t.atoms.bg_contrast_25,
            {
              gap: 3,
              paddingHorizontal: 3,
              paddingVertical: 3,
            },
          ],
          text: [a.text_xs],
        }
      }
    }
  }, [t, size, noBg])

  return (
    <Button
      disabled={disabled}
      label={label}
      onPress={e => {
        e.preventDefault()
        e.stopPropagation()
        onPress()
      }}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.rounded_full,
            outer,
            (hovered || pressed) && t.atoms.bg_contrast_50,
          ]}>
          {icon}

          <Text
            emoji
            style={[
              text,
              a.font_semi_bold,
              a.leading_tight,
              t.atoms.text_contrast_medium,
              {paddingRight: 3},
            ]}>
            {label}
          </Text>
        </View>
      )}
    </Button>
  )
}

export function FollowsYou({size = 'sm'}: CommonProps) {
  const t = useTheme()

  const variantStyles = useMemo(() => {
    switch (size) {
      case 'sm':
      case 'lg':
      default:
        return [
          {
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 4,
          },
        ]
    }
  }, [size])

  return (
    <View style={[variantStyles, a.justify_center, t.atoms.bg_contrast_50]}>
      <Text style={[a.text_xs, a.leading_tight]}>
        <Trans>Follows you</Trans>
      </Text>
    </View>
  )
}
