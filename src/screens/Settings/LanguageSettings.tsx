import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {APP_LANGUAGES, LANGUAGES} from '#/lib/../locale/languages'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {languageName, sanitizeAppLanguageSetting} from '#/locale/helpers'
import {useModalControls} from '#/state/modals'
import {useLanguagePrefs, useLanguagePrefsApi} from '#/state/preferences'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'
import * as Select from '#/components/Select'
import {Text} from '#/components/Typography'
import * as SettingsList from './components/SettingsList'

const DEDUPED_LANGUAGES = LANGUAGES.filter(
  (lang, i, arr) =>
    lang.code2 && arr.findIndex(l => l.code2 === lang.code2) === i,
)

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
    (value: string) => {
      if (!value) return
      if (langPrefs.primaryLanguage !== value) {
        setLangPrefs.setPrimaryLanguage(value)
      }
    },
    [langPrefs, setLangPrefs],
  )

  const onChangeAppLanguage = useCallback(
    (value: string) => {
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
        .map(l => languageName(l, langPrefs.appLanguage))
        .join(', ')
    )
  }, [langPrefs.appLanguage, langPrefs.contentLanguages])

  return (
    <Layout.Screen testID="PreferencesLanguagesScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Languages</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Group iconInset={false}>
            <SettingsList.ItemText>
              <Trans>App Language</Trans>
            </SettingsList.ItemText>
            <View style={[a.gap_md, a.w_full]}>
              <Text style={[a.leading_snug]}>
                <Trans>
                  Select which language to use for the app's user interface.
                </Trans>
              </Text>
              <Select.Root
                value={sanitizeAppLanguageSetting(langPrefs.appLanguage)}
                onValueChange={onChangeAppLanguage}>
                <Select.Trigger label={_(msg`Select app language`)}>
                  <Select.ValueText />
                  <Select.Icon />
                </Select.Trigger>
                <Select.Content
                  renderItem={({label, value}) => (
                    <Select.Item value={value} label={label}>
                      <Select.ItemIndicator />
                      <Select.ItemText>{label}</Select.ItemText>
                    </Select.Item>
                  )}
                  items={APP_LANGUAGES.map(l => ({
                    label: l.name,
                    value: l.code2,
                  }))}
                />
              </Select.Root>
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
              <Select.Root
                value={langPrefs.primaryLanguage}
                onValueChange={onChangePrimaryLanguage}>
                <Select.Trigger label={_(msg`Select primary language`)}>
                  <Select.ValueText />
                  <Select.Icon />
                </Select.Trigger>
                <Select.Content
                  renderItem={({label, value}) => (
                    <Select.Item value={value} label={label}>
                      <Select.ItemIndicator />
                      <Select.ItemText>{label}</Select.ItemText>
                    </Select.Item>
                  )}
                  items={DEDUPED_LANGUAGES.map(l => ({
                    label: languageName(l, langPrefs.appLanguage),
                    value: l.code2,
                  }))}
                />
              </Select.Root>
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
                shape="rectangular"
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
