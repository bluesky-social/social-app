import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import RNPickerSelect, {PickerSelectProps} from 'react-native-picker-select'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {APP_LANGUAGES, LANGUAGES} from '#/lib/../locale/languages'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {useModalControls} from '#/state/modals'
import {useLanguagePrefs, useLanguagePrefsApi} from '#/state/preferences'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon} from '#/components/icons/Chevron'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'LanguageSettings'>
export function LanguageSettingsScreen({}: Props) {
  const {_} = useLingui()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()
  const t = useTheme()

  const {openModal} = useModalControls()

  const onPressContentLanguages = useCallback(() => {
    openModal({name: 'content-languages-settings'})
  }, [openModal])

  const onChangePrimaryLanguage = useCallback(
    (value: Parameters<PickerSelectProps['onValueChange']>[0]) => {
      if (!value) return
      if (langPrefs.primaryLanguage !== value) {
        setLangPrefs.setPrimaryLanguage(value)
      }
    },
    [langPrefs, setLangPrefs],
  )

  const onChangeAppLanguage = useCallback(
    (value: Parameters<PickerSelectProps['onValueChange']>[0]) => {
      if (!value) return
      if (langPrefs.appLanguage !== value) {
        setLangPrefs.setAppLanguage(sanitizeAppLanguageSetting(value))
      }
    },
    [langPrefs, setLangPrefs],
  )

  const myLanguages = useMemo(() => {
    return (
      langPrefs.contentLanguages
        .map(lang => LANGUAGES.find(l => l.code2 === lang))
        .filter(Boolean)
        // @ts-ignore
        .map(l => l.name)
        .join(', ')
    )
  }, [langPrefs.contentLanguages])

  return (
    <Layout.Screen testID="PreferencesLanguagesScreen">
      <Layout.Header title={_(msg`Languages`)} />
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Group iconInset={false}>
            <SettingsList.ItemText>
              <Trans>App Language</Trans>
            </SettingsList.ItemText>
            <View style={[a.gap_md, a.w_full]}>
              <Text style={[a.leading_snug]}>
                <Trans>
                  Select your app language for the default text to display in
                  the app.
                </Trans>
              </Text>
              <View style={[a.relative, web([a.w_full, {maxWidth: 400}])]}>
                <RNPickerSelect
                  placeholder={{}}
                  value={sanitizeAppLanguageSetting(langPrefs.appLanguage)}
                  onValueChange={onChangeAppLanguage}
                  items={APP_LANGUAGES.filter(l => Boolean(l.code2)).map(l => ({
                    label: l.name,
                    value: l.code2,
                    key: l.code2,
                  }))}
                  style={{
                    inputAndroid: {
                      backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
                      color: t.atoms.text.color,
                      fontSize: 14,
                      letterSpacing: 0.5,
                      fontWeight: a.font_bold.fontWeight,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: a.rounded_xs.borderRadius,
                    },
                    inputIOS: {
                      backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
                      color: t.atoms.text.color,
                      fontSize: 14,
                      letterSpacing: 0.5,
                      fontWeight: a.font_bold.fontWeight,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: a.rounded_xs.borderRadius,
                    },
                    inputWeb: {
                      flex: 1,
                      width: '100%',
                      cursor: 'pointer',
                      // @ts-ignore web only
                      '-moz-appearance': 'none',
                      '-webkit-appearance': 'none',
                      appearance: 'none',
                      outline: 0,
                      borderWidth: 0,
                      backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
                      color: t.atoms.text.color,
                      fontSize: 14,
                      fontFamily: 'inherit',
                      letterSpacing: 0.5,
                      fontWeight: a.font_bold.fontWeight,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: a.rounded_xs.borderRadius,
                    },
                  }}
                />

                <View
                  style={[
                    a.absolute,
                    t.atoms.bg_contrast_25,
                    a.rounded_xs,
                    a.pointer_events_none,
                    a.align_center,
                    a.justify_center,
                    {
                      top: 1,
                      right: 1,
                      bottom: 1,
                      width: 40,
                    },
                  ]}>
                  <ChevronDownIcon style={[t.atoms.text]} />
                </View>
              </View>
            </View>
          </SettingsList.Group>
          <SettingsList.Divider />
          <SettingsList.Group iconInset={false}>
            <SettingsList.ItemText>
              <Trans>Primary Language</Trans>
            </SettingsList.ItemText>
            <View style={[a.gap_md, a.w_full]}>
              <Text style={[a.leading_snug]}>
                <Trans>
                  Select your preferred language for translations in your feed.
                </Trans>
              </Text>
              <View style={[a.relative, web([a.w_full, {maxWidth: 400}])]}>
                <RNPickerSelect
                  placeholder={{}}
                  value={langPrefs.primaryLanguage}
                  onValueChange={onChangePrimaryLanguage}
                  items={LANGUAGES.filter(l => Boolean(l.code2)).map(l => ({
                    label: l.name,
                    value: l.code2,
                    key: l.code2 + l.code3,
                  }))}
                  style={{
                    inputAndroid: {
                      backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
                      color: t.atoms.text.color,
                      fontSize: 14,
                      letterSpacing: 0.5,
                      fontWeight: a.font_bold.fontWeight,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: a.rounded_xs.borderRadius,
                    },
                    inputIOS: {
                      backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
                      color: t.atoms.text.color,
                      fontSize: 14,
                      letterSpacing: 0.5,
                      fontWeight: a.font_bold.fontWeight,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: a.rounded_xs.borderRadius,
                    },
                    inputWeb: {
                      flex: 1,
                      width: '100%',
                      cursor: 'pointer',
                      // @ts-ignore web only
                      '-moz-appearance': 'none',
                      '-webkit-appearance': 'none',
                      appearance: 'none',
                      outline: 0,
                      borderWidth: 0,
                      backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
                      color: t.atoms.text.color,
                      fontSize: 14,
                      fontFamily: 'inherit',
                      letterSpacing: 0.5,
                      fontWeight: a.font_bold.fontWeight,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: a.rounded_xs.borderRadius,
                    },
                  }}
                />

                <View
                  style={{
                    position: 'absolute',
                    top: 1,
                    right: 1,
                    bottom: 1,
                    width: 40,
                    backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
                    borderRadius: a.rounded_xs.borderRadius,
                    pointerEvents: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <ChevronDownIcon style={t.atoms.text} />
                </View>
              </View>
            </View>
          </SettingsList.Group>
          <SettingsList.Divider />
          <SettingsList.Group iconInset={false}>
            <SettingsList.ItemText>
              <Trans>Content Languages</Trans>
            </SettingsList.ItemText>
            <View style={[a.gap_md]}>
              <Text style={[a.leading_snug]}>
                <Trans>
                  Select which languages you want your subscribed feeds to
                  include. If none are selected, all languages will be shown.
                </Trans>
              </Text>

              <Button
                label={_(msg`Select content languages`)}
                size="small"
                color="secondary"
                variant="solid"
                onPress={onPressContentLanguages}
                style={[a.justify_start, web({maxWidth: 400})]}>
                <ButtonIcon
                  icon={myLanguages.length > 0 ? CheckIcon : PlusIcon}
                />
                <ButtonText
                  style={[t.atoms.text, a.text_md, a.flex_1, a.text_left]}
                  numberOfLines={1}>
                  {myLanguages.length > 0
                    ? myLanguages
                    : _(msg`Select languages`)}
                </ButtonText>
              </Button>
            </View>
          </SettingsList.Group>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
