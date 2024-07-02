import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {ModerationUI} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isJustAMute} from '#/lib/moderation'
import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Button} from '#/components/Button'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'
import {Text} from '#/components/Typography'

export function ContentHider({
  testID,
  modui,
  ignoreMute,
  style,
  childContainerStyle,
  children,
}: React.PropsWithChildren<{
  testID?: string
  modui: ModerationUI | undefined
  ignoreMute?: boolean
  style?: StyleProp<ViewStyle>
  childContainerStyle?: StyleProp<ViewStyle>
}>) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const [override, setOverride] = React.useState(false)
  const control = useModerationDetailsDialogControl()

  const blur = modui?.blurs[0]
  const desc = useModerationCauseDescription(blur)

  if (!blur || (ignoreMute && isJustAMute(modui))) {
    return (
      <View testID={testID} style={[styles.outer, style]}>
        {children}
      </View>
    )
  }

  return (
    <View testID={testID} style={[a.overflow_hidden, style]}>
      <ModerationDetailsDialog control={control} modcause={blur} />

      <Button
        onPress={e => {
          e.preventDefault()
          e.stopPropagation()
          if (!modui.noOverride) {
            setOverride(v => !v)
          } else {
            control.open()
          }
        }}
        label={desc.name}
        accessibilityHint={
          modui.noOverride
            ? _(msg`Learn more about the moderation applied to this content.`)
            : override
            ? _(msg`Hide the content`)
            : _(msg`Show the content`)
        }>
        {state => (
          <View
            style={[
              a.flex_row,
              a.w_full,
              a.justify_start,
              a.align_center,
              a.py_md,
              a.px_lg,
              a.gap_xs,
              a.rounded_sm,
              t.atoms.bg_contrast_25,
              gtMobile && [a.gap_sm, a.py_lg, a.mt_xs, a.px_xl],
              (state.hovered || state.pressed) && t.atoms.bg_contrast_50,
            ]}>
            <desc.icon
              size="md"
              fill={t.atoms.text_contrast_medium.color}
              style={{marginLeft: -2}}
            />
            <Text
              style={[
                a.flex_1,
                a.text_left,
                a.font_bold,
                a.leading_snug,
                gtMobile && [a.font_semibold],
                t.atoms.text_contrast_medium,
                web({
                  marginBottom: 1,
                }),
              ]}>
              {desc.name}
            </Text>
            {!modui.noOverride && (
              <Text
                style={[
                  a.font_bold,
                  a.leading_snug,
                  gtMobile && [a.font_semibold],
                  t.atoms.text_contrast_high,
                  web({
                    marginBottom: 1,
                  }),
                ]}>
                {override ? <Trans>Hide</Trans> : <Trans>Show</Trans>}
              </Text>
            )}
          </View>
        )}
      </Button>

      {desc.source && blur.type === 'label' && !override && (
        <Button
          onPress={e => {
            e.preventDefault()
            e.stopPropagation()
            control.open()
          }}
          label={_(
            msg`Learn more about the moderation applied to this content.`,
          )}
          style={[a.pt_sm]}>
          {state => (
            <Text
              style={[
                a.flex_1,
                a.text_sm,
                a.font_normal,
                a.leading_snug,
                t.atoms.text_contrast_medium,
                a.text_left,
              ]}>
              {desc.sourceType === 'user' ? (
                <Trans>Labeled by the author.</Trans>
              ) : (
                <Trans>Labeled by {sanitizeDisplayName(desc.source!)}.</Trans>
              )}{' '}
              <Text
                style={[
                  {color: t.palette.primary_500},
                  a.text_sm,
                  state.hovered && [web({textDecoration: 'underline'})],
                ]}>
                <Trans>Learn more.</Trans>
              </Text>
            </Text>
          )}
        </Button>
      )}

      {override && <View style={childContainerStyle}>{children}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {},
  cover: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 18,
  },
  showBtn: {
    marginLeft: 'auto',
    alignSelf: 'center',
  },
})
