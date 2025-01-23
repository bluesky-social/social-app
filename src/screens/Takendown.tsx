import {Modal, ScrollView, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {StatusBar} from 'expo-status-bar'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isIOS, isNative, isWeb} from '#/platform/detection'
import {useSessionApi} from '#/state/session'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, native, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {InlineLinkText} from '#/components/Link'
import {P, Text} from '#/components/Typography'

const COL_WIDTH = 400

export function Takendown() {
  const {_} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const {gtMobile} = useBreakpoints()
  const {logoutCurrentAccount} = useSessionApi()

  const checkBtn = (
    <Button
      variant="solid"
      color="secondary_inverted"
      size="large"
      label={_(msg`Appeal takedown`)}>
      <ButtonText>
        <Trans>Appeal suspension</Trans>
      </ButtonText>
    </Button>
  )

  const logoutBtn = (
    <Button
      variant="ghost"
      size="large"
      color="secondary"
      label={_(msg`Log out`)}
      onPress={() => logoutCurrentAccount('Takendown')}>
      <ButtonText>
        <Trans>Log out</Trans>
      </ButtonText>
    </Button>
  )

  const webLayout = isWeb && gtMobile

  return (
    <Modal
      visible
      animationType={native('slide')}
      presentationStyle="formSheet"
      style={[web(a.util_screen_outer)]}>
      {isIOS && <StatusBar style="light" />}
      <ScrollView
        style={[a.flex_1, t.atoms.bg]}
        contentContainerStyle={web(a.my_auto)}
        bounces={false}
        centerContent={isNative}>
        <View
          style={[
            a.flex_row,
            a.justify_center,
            gtMobile ? a.pt_4xl : [a.px_xl, a.pt_4xl],
          ]}>
          <View style={[a.flex_1, {maxWidth: COL_WIDTH, minHeight: COL_WIDTH}]}>
            <View style={[a.pb_xl]}>
              <Logo width={64} />
            </View>

            <Text style={[a.text_4xl, a.font_heavy, a.pb_md]}>
              <Trans>Your account has been suspended</Trans>
            </Text>
            <P style={[t.atoms.text_contrast_medium]}>
              <Trans>
                Your account was found to be in violation of the{' '}
                <InlineLinkText
                  label={_(msg`Bluesky Social Terms of Service`)}
                  to="https://bsky.social/about/support/tos"
                  style={[a.text_md, a.leading_normal]}>
                  Bluesky Social Terms of Service
                </InlineLinkText>
                . You can appeal this decision if you believe it was made in
                error.
              </Trans>
            </P>

            {webLayout && (
              <View
                style={[
                  a.w_full,
                  a.flex_row,
                  a.justify_between,
                  a.pt_5xl,
                  {paddingBottom: 200},
                ]}>
                {logoutBtn}
                {checkBtn}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {!webLayout && (
        <View
          style={[
            a.align_center,
            t.atoms.bg,
            gtMobile ? a.px_5xl : a.px_xl,
            {paddingBottom: Math.max(insets.bottom, a.pb_5xl.paddingBottom)},
          ]}>
          <View style={[a.w_full, a.gap_sm, {maxWidth: COL_WIDTH}]}>
            {checkBtn}
            {logoutBtn}
          </View>
        </View>
      )}
    </Modal>
  )
}
