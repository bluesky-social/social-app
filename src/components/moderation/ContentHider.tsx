import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {ModerationUI} from '@atproto/api'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {isJustAMute} from '#/lib/moderation'
import {sanitizeDisplayName} from '#/lib/strings/display-names'

import {atoms as a, useTheme, useBreakpoints} from '#/alf'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {Text} from '#/components/Typography'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'

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
  const [override, setOverride] = React.useState(false)
  const {gtMobile} = useBreakpoints()
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
        variant="solid"
        color="tertiary"
        size="large"
        shape="default"
        onPress={() => {
          if (!modui.noOverride) {
            setOverride(v => !v)
          } else {
            control.open()
          }
        }}
        label={desc.name}
        accessibilityHint={
          override ? _(msg`Hide the content`) : _(msg`Show the content`)
        }
        style={
          gtMobile ? [a.py_lg, a.px_xl, a.gap_sm] : [a.py_md, a.px_lg, a.gap_sm]
        }>
        <ButtonIcon icon={desc.icon} position="left" />
        <ButtonText style={[a.flex_1, a.text_left]}>{desc.name}</ButtonText>
        {!modui.noOverride && (
          <ButtonText>
            {override ? <Trans>Hide</Trans> : <Trans>Show</Trans>}
          </ButtonText>
        )}
      </Button>
      {desc.source && blur.type === 'label' && !override && (
        <Button
          variant="ghost"
          size="tiny"
          onPress={() => {
            control.open()
          }}
          label={_(msg`Learn more`)}
          style={[]}>
          <ButtonText
            style={[
              a.flex_1,
              a.text_sm,
              a.font_normal,
              t.atoms.text_contrast_medium,
              a.text_left,
            ]}>
            <Trans>
              {sanitizeDisplayName(desc.source)}.{' '}
              <Text style={[{color: t.palette.primary_500}, a.text_sm]}>
                Learn more.
              </Text>
            </Trans>
          </ButtonText>
        </Button>
      )}
      {override && <View style={childContainerStyle}>{children}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
  },
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
