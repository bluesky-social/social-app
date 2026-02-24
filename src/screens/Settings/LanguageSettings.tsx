import {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {languageName, sanitizeAppLanguageSetting} from '#/locale/helpers'
import {APP_LANGUAGES, LANGUAGES} from '#/locale/languages'
import {useLanguagePrefs, useLanguagePrefsApi} from '#/state/preferences'
import {atoms as a, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {LanguageSelectDialog} from '#/components/dialogs/LanguageSelectDialog'
import * as Toggle from '#/components/forms/Toggle'
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

  const contentLanguagePrefsControl = useDialogControl()

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

  const [recentLanguages, setRecentLanguages] = useState<string[]>(
    langPrefs.contentLanguages,
  )

  const possibleLanguages = useMemo(() => {
    return [
      ...new Set([
        ...recentLanguages,
        ...langPrefs.contentLanguages,
        ...langPrefs.primaryLanguage,
      ]),
    ]
      .map(lang => LANGUAGES.find(l => l.code2 === lang))
      .filter(x => !!x)
  }, [recentLanguages, langPrefs.contentLanguages, langPrefs.primaryLanguage])

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
              <Trans>App language</Trans>
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
                  label={_(msg`App language`)}
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
              <Trans>Primary language</Trans>
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
                  label={_(msg`Primary language`)}
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
              <Trans>Content languages</Trans>
            </SettingsList.ItemText>
            <View style={[a.gap_md]}>
              <Text style={[a.leading_snug]}>
                <Trans>
                  Select which languages you want your subscribed feeds to
                  include. If none are selected, all languages will be shown.
                </Trans>
              </Text>

              {langPrefs.contentLanguages.length === 0 && (
                <Admonition type="info">
                  <Trans>All languages will be shown in your feeds.</Trans>
                </Admonition>
              )}

              <View style={[a.w_full, web({maxWidth: 400})]}>
                <Toggle.Group
                  label={_(msg`Select content languages`)}
                  values={langPrefs.contentLanguages}
                  onChange={setLangPrefs.setContentLanguages}>
                  <Toggle.PanelGroup>
                    {possibleLanguages.map((language, index) => {
                      const name = languageName(language, langPrefs.appLanguage)
                      return (
                        <Toggle.Item
                          key={language.code2}
                          name={language.code2}
                          label={name}>
                          {({selected}) => (
                            <Toggle.Panel
                              active={selected}
                              adjacent={index === 0 ? 'trailing' : 'both'}>
                              <Toggle.Checkbox />
                              <Toggle.PanelText>{name}</Toggle.PanelText>
                            </Toggle.Panel>
                          )}
                        </Toggle.Item>
                      )
                    })}
                    <Button
                      label={_(msg`Add more languages...`)}
                      onPress={contentLanguagePrefsControl.open}>
                      <Toggle.Panel adjacent="leading">
                        <Toggle.PanelIcon icon={PlusIcon} />
                        <Toggle.PanelText>
                          Add more languages...
                        </Toggle.PanelText>
                      </Toggle.Panel>
                    </Button>
                  </Toggle.PanelGroup>
                </Toggle.Group>
              </View>

              <LanguageSelectDialog
                control={contentLanguagePrefsControl}
                titleText={<Trans>Select content languages</Trans>}
                subtitleText={
                  <Trans>
                    If none are selected, all languages will be shown in your
                    feeds.
                  </Trans>
                }
                currentLanguages={langPrefs.contentLanguages}
                onSelectLanguages={languages => {
                  setLangPrefs.setContentLanguages(languages)
                  setRecentLanguages(recent => [
                    ...new Set([...recent, ...languages]),
                  ])
                }}
              />
            </View>
          </SettingsList.Group>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
