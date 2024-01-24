import React from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {atoms as a, useTheme, useBreakpoints} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'
import {isWeb} from '#/platform/detection'
import {H2, P} from '#/components/Typography'
import {ScrollView} from '#/view/com/util/Views'

const COL_WIDTH = 500

export function Deactivated() {
  const {_} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const {gtMobile} = useBreakpoints()

  const dialogLabel = _(msg`You're in line`)

  const checkBtn = (
    <Button
      variant="solid"
      color="primary"
      size="large"
      label={_(msg`Check my status`)}
      onPress={() => {}}>
      <ButtonText>
        <Trans>Check my status</Trans>
      </ButtonText>
    </Button>
  )

  return (
    <View
      aria-modal
      role="dialog"
      aria-role="dialog"
      aria-label={dialogLabel}
      accessibilityLabel={dialogLabel}
      accessibilityHint=""
      style={[a.absolute, a.inset_0, a.flex_1, t.atoms.bg]}>
      <ScrollView
        style={[a.h_full, a.w_full]}
        contentContainerStyle={{borderWidth: 0}}>
        <View
          style={[a.flex_row, a.justify_center, gtMobile ? a.px_5xl : a.px_xl]}>
          <View style={[a.flex_1, {maxWidth: COL_WIDTH}]}>
            {/* Placeholder */}
            <View
              style={[
                a.w_full,
                a.justify_center,
                a.align_center,
                a.mb_xl,
                {backgroundColor: t.palette.contrast_50, height: 100},
              ]}>
              <Text style={a.text_md}>
                Picture a sweating butterfly being here maybe :)
              </Text>
            </View>

            <H2 style={[a.pb_sm]}>
              <Trans>You're in line</Trans>
            </H2>
            <P style={[t.atoms.text_contrast_700]}>
              <Trans>
                There's been a rush of new users! We'll activate your account as
                soon as we can.
              </Trans>
            </P>

            <View
              style={[
                // a.border,
                a.rounded_md,
                // t.atoms.border,
                a.p_2xl,
                a.mt_2xl,
                t.atoms.bg_contrast_50,
              ]}>
              <P style={[]}>
                <Text style={[a.font_bold, a.text_md]}>
                  <Trans>You are number 10 in line.</Trans>{' '}
                </Text>
                <Trans>
                  We estimate 15 more minutes until your account is ready.
                </Trans>
              </P>
            </View>

            {isWeb && gtMobile && (
              <View style={[a.w_full, a.flex_row, a.justify_between, a.pt_5xl]}>
                <Button
                  variant="ghost"
                  size="large"
                  label={_(msg`Check my status`)}
                  onPress={() => {}}>
                  <ButtonText style={[{color: t.palette.primary_500}]}>
                    <Trans>Log out</Trans>
                  </ButtonText>
                </Button>
                {checkBtn}
              </View>
            )}
          </View>

          <View style={{height: 200}} />
        </View>
      </ScrollView>

      {(!isWeb || !gtMobile) && (
        <View
          style={[
            a.align_center,
            gtMobile ? a.px_5xl : a.px_xl,
            {
              paddingBottom: Math.max(insets.bottom, a.pb_5xl.paddingBottom),
            },
          ]}>
          <View style={[a.w_full, a.gap_sm, {maxWidth: COL_WIDTH}]}>
            {checkBtn}
            <Button
              variant="ghost"
              size="large"
              label={_(msg`Check my status`)}
              onPress={() => {}}>
              <ButtonText style={[{color: t.palette.primary_500}]}>
                <Trans>Log out</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}
