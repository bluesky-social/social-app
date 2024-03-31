import React from 'react'
import {View} from 'react-native'
import RNPickerSelect, {PickerSelectProps} from 'react-native-picker-select'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {APP_LANGUAGES} from '#/locale/languages'
import {useLanguagePrefs, useLanguagePrefsApi} from '#/state/preferences'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'
import {CenteredView} from '../util/Views'

export const SplashScreen = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const t = useTheme()
  const {_} = useLingui()

  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()
  const insets = useSafeAreaInsets()

  const sanitizedLang = sanitizeAppLanguageSetting(langPrefs.appLanguage)

  const onChangeAppLanguage = React.useCallback(
    (value: Parameters<PickerSelectProps['onValueChange']>[0]) => {
      if (!value) return
      if (sanitizedLang !== value) {
        setLangPrefs.setAppLanguage(sanitizeAppLanguageSetting(value))
      }
    },
    [sanitizedLang, setLangPrefs],
  )

  return (
    <CenteredView style={[a.h_full, a.flex_1]}>
      <ErrorBoundary>
        <View style={[{flex: 1}, a.justify_center, a.align_center]}>
          <Logo width={92} fill="sky" />

          <View style={[a.pb_sm, a.pt_5xl]}>
            <Logotype width={161} fill={t.atoms.text.color} />
          </View>

          <Text
            style={[a.text_md, a.font_semibold, t.atoms.text_contrast_medium]}>
            <Trans>What's up?</Trans>
          </Text>
        </View>
        <View testID="signinOrCreateAccount">
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
              <Trans>Sign in</Trans>
            </ButtonText>
          </Button>
        </View>
        <View
          style={[
            a.px_lg,
            a.pt_md,
            a.pb_2xl,
            a.justify_center,
            a.align_center,
          ]}>
          <View style={a.relative}>
            <RNPickerSelect
              placeholder={{}}
              value={sanitizedLang}
              onValueChange={onChangeAppLanguage}
              items={APP_LANGUAGES.filter(l => Boolean(l.code2)).map(l => ({
                label: l.name,
                value: l.code2,
                key: l.code2,
              }))}
              useNativeAndroidPickerStyle={false}
              style={{
                inputAndroid: {
                  color: t.atoms.text_contrast_medium.color,
                  fontSize: 16,
                  paddingRight: 12 + 4,
                },
                inputIOS: {
                  color: t.atoms.text.color,
                  fontSize: 16,
                  paddingRight: 12 + 4,
                },
              }}
            />

            <View
              style={[
                a.absolute,
                a.inset_0,
                {left: 'auto'},
                {pointerEvents: 'none'},
                a.align_center,
                a.justify_center,
              ]}>
              <ChevronDown fill={t.atoms.text.color} size="xs" />
            </View>
          </View>
        </View>
        <View style={{height: insets.bottom}} />
      </ErrorBoundary>
    </CenteredView>
  )
}
