import {useEffect, useState} from 'react'
import {Pressable, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {useKawaiiMode} from '#/state/preferences/kawaii'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {Logo3D} from '#/view/icons/Logo3D'
import {
  AppClipOverlay,
  postAppClipMessage,
} from '#/screens/StarterPack/StarterPackLandingScreen'
import {atoms as a, useTheme} from '#/alf'
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
import {BetaTag} from '#/components/BetaTag'
import {Button, ButtonText} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as TimesIcon} from '#/components/icons/Times'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {BRAND} from '#/config/brand'

export const SplashScreen = ({
  onDismiss,
  onPressSignin,
  onPressCreateAccount,
}: {
  onDismiss?: () => void
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const {_} = useLingui()
  const t = useTheme()
  const {isTabletOrMobile: IS_WEB_MOBILE} = useWebMediaQueries()
  const [showClipOverlay, setShowClipOverlay] = useState(false)

  useEffect(() => {
    const getParams = new URLSearchParams(window.location.search)
    const clip = getParams.get('clip')
    if (clip === 'true') {
      setShowClipOverlay(true)
      postAppClipMessage({
        action: 'present',
      })
    }
  }, [])

  const kawaii = useKawaiiMode()

  return (
    <>
      {onDismiss && (
        <Pressable
          accessibilityRole="button"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            padding: 20,
            zIndex: 100,
          }}
          onPress={onDismiss}>
          <TimesIcon width={24} style={t.atoms.text} />
        </Pressable>
      )}

      <Layout.Center style={[a.h_full, a.flex_1]} ignoreTabletLayoutOffset>
        <View
          testID="noSessionView"
          style={[
            a.h_full,
            a.justify_center,
            // @ts-expect-error web only
            {paddingBottom: '20vh'},
            IS_WEB_MOBILE && a.pb_5xl,
            t.atoms.border_contrast_medium,
            a.align_center,
            a.gap_5xl,
            a.flex_1,
          ]}>
          <ErrorBoundary>
            <View style={[a.justify_center, a.align_center]}>
              {!kawaii && (
                <View style={[a.pt_5xl, a.pb_sm, a.align_center, a.gap_sm]}>
                  <Logo3D width={161} />
                  <BetaTag />
                </View>
              )}

              <Text
                style={[
                  a.text_md,
                  a.font_semi_bold,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>What's up?</Trans>
              </Text>
            </View>

            <View
              testID="signinOrCreateAccount"
              style={[a.w_full, a.px_xl, a.gap_md, a.pb_2xl, {maxWidth: 320}]}>
              <Button
                testID="createAccountButton"
                onPress={onPressCreateAccount}
                label={_(msg`Create new account`)}
                accessibilityHint={_(
                  msg`Opens flow to create a new Bluesky account`,
                )}
                size="large"
                variant="solid"
                color="primary">
                <ButtonText>
                  <Trans>Create account</Trans>
                </ButtonText>
              </Button>
              <Button
                testID="signInButton"
                onPress={onPressSignin}
                label={_(msg`Sign in`)}
                accessibilityHint={_(
                  msg`Opens flow to sign in to your existing Bluesky account`,
                )}
                size="large"
                variant="solid"
                color="secondary">
                <ButtonText>
                  <Trans>Sign in</Trans>
                </ButtonText>
              </Button>
            </View>
          </ErrorBoundary>
        </View>
        <Footer />
      </Layout.Center>
      <AppClipOverlay
        visible={showClipOverlay}
        setIsVisible={setShowClipOverlay}
      />
    </>
  )
}

function Footer() {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <View
      style={[
        a.absolute,
        a.inset_0,
        {top: 'auto'},
        a.px_xl,
        a.py_lg,
        a.border_t,
        a.flex_row,
        a.align_center,
        a.flex_wrap,
        a.gap_xl,
        a.flex_1,
        t.atoms.border_contrast_medium,
      ]}>
      <InlineLinkText label={_(msg`Terms of Service`)} to={BRAND.links.tos}>
        <Trans>Terms of Service</Trans>
      </InlineLinkText>
      <InlineLinkText label={_(msg`Privacy Policy`)} to={BRAND.links.privacy}>
        <Trans>Privacy Policy</Trans>
      </InlineLinkText>

      <View style={a.flex_1} />

      <AppLanguageDropdown />
    </View>
  )
}
