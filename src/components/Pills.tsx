import React from 'react'
import {View} from 'react-native'
import {BSKY_LABELER_DID, ModerationCause} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, ViewStyleProp} from '#/alf'
import {Button} from '#/components/Button'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'
import {Text} from '#/components/Typography'

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
  cause: ModerationCause
  disableDetailsDialog?: boolean
  noBg?: boolean
} & CommonProps

export function Label({cause, size = 'sm', disableDetailsDialog}: LabelProps) {
  const t = useTheme()
  const control = useModerationDetailsDialogControl()
  const desc = useModerationCauseDescription(cause)
  const isLabeler = Boolean(desc.sourceType && desc.sourceDid)
  const isBlueskyLabel =
    desc.sourceType === 'labeler' && desc.sourceDid === BSKY_LABELER_DID

  const {outer, avi, text} = React.useMemo(() => {
    switch (size) {
      case 'lg': {
        return {
          outer: [{minWidth: 80}],
          avi: 16,
          text: [a.text_xs],
        }
      }
      case 'sm':
      default: {
        return {
          outer: [{minWidth: 80}],
          avi: 12,
          text: [a.text_2xs],
        }
      }
    }
  }, [size])

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
              {
                backgroundColor: '#fff',
                gap: 1,
                paddingHorizontal: 1,
                paddingVertical: 1,
                borderWidth: 1,
                borderColor: '#666',
              },
              outer,
            ]}>
            {isBlueskyLabel || !isLabeler ? (
              <desc.icon
                width={avi}
                fill={t.atoms.text_contrast_medium.color}
              />
            ) : (
              <UserAvatar
                avatar={desc.sourceAvi}
                shape="square"
                actuallySquare={true}
                aspect={1.6}
                size={avi}
              />
            )}

            <Text
              style={[
                text,
                {
                  backgroundColor: '#898e79',
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                },
                a.font_semibold,
                a.leading_tight,
                a.flex_grow,
                {paddingLeft: 3, paddingRight: 3},
                (hovered || pressed) && {backgroundColor: '#5a5e4f'},
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
