import {useMemo} from 'react'
import {Platform, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {codeToLanguageName, languageName} from '#/locale/helpers'
import {LANGUAGES} from '#/locale/languages'
import {useLanguagePrefs} from '#/state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import * as Select from '#/components/Select'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {useTranslateOnDevice} from '#/translation'

export function TranslatedPost({
  postText,
  postUri,
  hideLoading = false,
}: {
  postText: string
  postUri: string
  hideLoading: boolean
}) {
  const {translationState} = useTranslateOnDevice(postUri)

  if (translationState.status === 'loading' && !hideLoading) {
    return <TranslationLoading />
  }

  if (translationState.status === 'success') {
    return (
      <TranslationResult
        postText={postText}
        postUri={postUri}
        sourceLanguage={translationState.sourceLanguage}
        translatedText={translationState.translatedText}
      />
    )
  }

  return null
}

function TranslationLoading() {
  const t = useTheme()

  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm, a.py_xs]}>
      <Loader size="sm" />
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        <Trans>Translating…</Trans>
      </Text>
    </View>
  )
}

function TranslationResult({
  postText,
  postUri,
  sourceLanguage,
  translatedText,
}: {
  postText: string
  postUri: string
  sourceLanguage: string | null
  translatedText: string
}) {
  const t = useTheme()
  const {i18n} = useLingui()

  const langName = sourceLanguage
    ? codeToLanguageName(sourceLanguage, i18n.locale)
    : undefined

  return (
    <>
      <View style={[a.py_xs, a.gap_xs, a.mt_sm]}>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {langName ? (
            <Trans>Translated from {langName}</Trans>
          ) : (
            <Trans>Translated</Trans>
          )}
          {sourceLanguage != null && (
            <>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                {' '}
                &middot;
              </Text>{' '}
              <TranslationLanguageSelect
                postUri={postUri}
                sourceLanguage={sourceLanguage}
                postText={postText}
              />
            </>
          )}
        </Text>
        <Text emoji selectable style={[a.text_md]}>
          {translatedText}
        </Text>
      </View>
    </>
  )
}

function TranslationLanguageSelect({
  postText,
  postUri,
  sourceLanguage,
}: {
  postText: string
  postUri: string
  sourceLanguage: string
}) {
  const ax = useAnalytics()
  const {_} = useLingui()
  const langPrefs = useLanguagePrefs()
  const {translate} = useTranslateOnDevice(postUri)

  const items = useMemo(
    () =>
      LANGUAGES.filter(
        (lang, index, self) =>
          !langPrefs.primaryLanguage.startsWith(lang.code2) && // Don't show the current language as it would be redundant
          index === self.findIndex(t => t.code2 === lang.code2), // Remove dupes (which will happen due to multiple code3 values mapping to the same code2)
      )
        .sort(
          (a, b) =>
            languageName(a, langPrefs.appLanguage).localeCompare(
              languageName(b, langPrefs.appLanguage),
              langPrefs.appLanguage,
            ), // Localized sort
        )
        .map(l => ({
          label: languageName(l, langPrefs.appLanguage), // The viewer may not be familiar with the source language, so localize the name
          value: l.code2,
        })),
    [langPrefs],
  )

  const handleChangeTranslationLanguage = (sourceLangCode: string) => {
    ax.metric('translate:override', {
      os: Platform.OS,
      sourceLanguage: sourceLangCode,
      targetLanguage: langPrefs.primaryLanguage,
    })
    void translate(postText, langPrefs.primaryLanguage, sourceLangCode)
  }

  return (
    <Select.Root
      value={sourceLanguage}
      onValueChange={handleChangeTranslationLanguage}>
      <Select.Trigger hitSlop={10} label={_(msg`Change translation language`)}>
        {({props}) => {
          return (
            <Text {...props} style={[a.text_xs]}>
              <Trans>Edit</Trans>
            </Text>
          )
        }}
      </Select.Trigger>
      <Select.Content
        label={_(msg`Select the source language`)}
        renderItem={({label, value}) => (
          <Select.Item value={value} label={label}>
            <Select.ItemIndicator />
            <Select.ItemText>{label}</Select.ItemText>
          </Select.Item>
        )}
        items={items}
      />
    </Select.Root>
  )
}
