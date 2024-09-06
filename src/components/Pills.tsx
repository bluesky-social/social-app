import React from 'react'
import {View} from 'react-native'
import {BSKY_LABELER_DID, ModerationCause} from '@atproto/api'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, Theme, useTheme, ViewStyleProp} from '#/alf'
import {Button} from '#/components/Button'
import {ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeftIcon} from '#/components/icons/Chevron'
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
  const styles = React.useMemo(() => {
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

  const {outer, avi, text} = React.useMemo(
    () => getLabelStyles(size, t, noBg),
    [t, size, noBg],
  )

  return (
    <>
      <Button
        disabled={disableDetailsDialog}
        label={desc.name}
        onPress={e => {
          e.preventDefault()
          e.stopPropagation()
          control.open()
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
            {isBlueskyLabel || !isLabeler ? (
              <desc.icon
                width={avi}
                fill={t.atoms.text_contrast_medium.color}
              />
            ) : (
              <UserAvatar avatar={desc.sourceAvi} size={avi} />
            )}

            <Text
              style={[
                text,
                a.font_semibold,
                a.leading_tight,
                t.atoms.text_contrast_medium,
                {paddingRight: 3},
              ]}>
              {desc.name}
            </Text>
          </View>
        )}
      </Button>

      {!disableDetailsDialog && (
        <ModerationDetailsDialog control={control} modcause={cause} />
      )}
    </>
  )
}

export type OverflowProps = {
  count: number
  noBg?: boolean
  isExpanded?: boolean
  onToggle: () => void
} & CommonProps

export function Overflow({
  count,
  size = 'sm',
  isExpanded,
  onToggle,
  noBg,
}: OverflowProps) {
  const t = useTheme()
  const {i18n} = useLingui()

  const {outer, text} = React.useMemo(
    () => getLabelStyles(size, t, noBg),
    [t, size, noBg],
  )

  const label = isExpanded
    ? i18n._(msg`Hide`)
    : i18n._(plural(count, {one: '+ # other', other: '+# others'}))

  return (
    <Button
      label={label}
      onPress={e => {
        e.preventDefault()
        e.stopPropagation()
        onToggle()
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
          {isExpanded! && (
            <ChevronLeftIcon
              size="xs"
              style={[t.atoms.text_contrast_medium, {marginLeft: 3}]}
            />
          )}
          <Text
            style={[
              text,
              a.font_semibold,
              a.leading_tight,
              t.atoms.text_contrast_medium,
              {paddingRight: 3, paddingLeft: isExpanded ? 0 : 3},
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

  const variantStyles = React.useMemo(() => {
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
    <View style={[variantStyles, a.justify_center, t.atoms.bg_contrast_25]}>
      <Text style={[a.text_xs, a.leading_tight]}>
        <Trans>Follows You</Trans>
      </Text>
    </View>
  )
}

function getLabelStyles(size: string, t: Theme, noBg: boolean | undefined) {
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
        avi: 16,
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
        avi: 12,
        text: [a.text_xs],
      }
    }
  }
}
