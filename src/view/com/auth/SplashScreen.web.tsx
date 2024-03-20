import React from 'react'
import {View, Pressable} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {CenteredView} from '../util/Views'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {Trans, msg} from '@lingui/macro'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {useLingui} from '@lingui/react'
import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {useLanguagePrefs, useLanguagePrefsApi} from '#/state/preferences'
import {APP_LANGUAGES} from '#/locale/languages'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'
import {InlineLink} from '#/components/Link'

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
  const {isTabletOrMobile: isMobileWeb} = useWebMediaQueries()

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
          <FontAwesomeIcon
            icon="x"
            size={24}
            style={{
              color: String(t.atoms.text.color),
            }}
          />
        </Pressable>
      )}

      <CenteredView style={[a.h_full, a.flex_1]}>
        <View
          testID="noSessionView"
          style={[
            a.h_full,
            a.justify_center,
            // @ts-ignore web only
            {paddingBottom: '20vh'},
            isMobileWeb && a.pb_5xl,
            t.atoms.border_contrast_medium,
            a.align_center,
            a.gap_5xl,
          ]}>
          <ErrorBoundary>
            <View style={[a.justify_center, a.align_center]}>
              <Logo width={92} fill="sky" />

              <View style={[a.pb_sm, a.pt_5xl]}>
                <Logotype width={161} fill={t.atoms.text.color} />
              </View>

              <Text
                style={[
                  a.text_md,
                  a.font_semibold,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>What's up?</Trans>
              </Text>
            </View>

            <View
              testID="signinOrCreateAccount"
              style={[a.w_full, {maxWidth: 320}]}>
              <Button
                testID="createAccountButton"
                onPress={onPressCreateAccount}
                accessibilityRole="button"
                label={_(msg`Create new account`)}
                accessibilityHint={_(
                  msg`Opens flow to create a new Bluesky account`,
                )}
                style={[a.mx_xl, a.mb_xl]}
                size="large"
                variant="solid"
                color="primary">
                <ButtonText>
                  <Trans>Create a new account</Trans>
                </ButtonText>
              </Button>
              <Button
                testID="signInButton"
                onPress={onPressSignin}
                label={_(msg`Sign in`)}
                accessibilityHint={_(
                  msg`Opens flow to sign into your existing Bluesky account`,
                )}
                style={[a.mx_xl, a.mb_xl]}
                size="large"
                variant="solid"
                color="secondary">
                <ButtonText>
                  <Trans>Sign In</Trans>
                </ButtonText>
              </Button>
            </View>
          </ErrorBoundary>
        </View>
        <Footer />
      </CenteredView>
    </>
  )
}

function Footer() {
  const t = useTheme()

  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()

  const sanitizedLang = sanitizeAppLanguageSetting(langPrefs.appLanguage)

  const onChangeAppLanguage = React.useCallback(
    (ev: React.ChangeEvent<HTMLSelectElement>) => {
      const value = ev.target.value

      if (!value) return
      if (sanitizedLang !== value) {
        setLangPrefs.setAppLanguage(sanitizeAppLanguageSetting(value))
      }
    },
    [sanitizedLang, setLangPrefs],
  )

  return (
    <View
      style={[
        a.absolute,
        a.inset_0,
        {top: 'auto'},
        a.p_xl,
        a.border_t,
        a.flex_row,
        a.flex_wrap,
        a.gap_xl,
        a.flex_1,
        t.atoms.border_contrast_medium,
      ]}>
      <InlineLink to="https://bsky.social">
        <Trans>Business</Trans>
      </InlineLink>
      <InlineLink to="https://bsky.social/about/blog">
        <Trans>Blog</Trans>
      </InlineLink>
      <InlineLink to="https://bsky.social/about/join">
        <Trans>Jobs</Trans>
      </InlineLink>

      <View style={a.flex_1} />

      <View style={[a.flex_row, a.gap_sm, a.align_center, a.flex_shrink]}>
        <Text aria-hidden={true} style={t.atoms.text_contrast_medium}>
          {APP_LANGUAGES.find(l => l.code2 === sanitizedLang)?.name}
        </Text>
        <ChevronDown
          fill={t.atoms.text.color}
          size="xs"
          style={a.flex_shrink}
        />

        <select
          value={sanitizedLang}
          onChange={onChangeAppLanguage}
          style={{
            cursor: 'pointer',
            MozAppearance: 'none',
            WebkitAppearance: 'none',
            appearance: 'none',
            position: 'absolute',
            inset: 0,
            width: '100%',
            color: 'transparent',
            background: 'transparent',
            border: 0,
            padding: 0,
          }}>
          {APP_LANGUAGES.filter(l => Boolean(l.code2)).map(l => (
            <option key={l.code2} value={l.code2}>
              {l.name}
            </option>
          ))}
        </select>
      </View>
    </View>
  )
}
