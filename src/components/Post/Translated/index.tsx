import {useMemo} from 'react'
import {Platform, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_30} from '#/lib/constants'
import {useTranslate} from '#/lib/translation'
import {type TranslationFunction} from '#/lib/translation/types'
import {codeToLanguageName, languageName} from '#/locale/helpers'
import {LANGUAGES} from '#/locale/languages'
import {useLanguagePrefs} from '#/state/preferences'
import {atoms as a, native, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Loader} from '#/components/Loader'
import * as Select from '#/components/Select'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

export function TranslatedPost({
  translationKey,
  postText,
}: {
  translationKey: string
  postText: string
}) {
  const {translate, translationState} = useTranslate({key: translationKey})

  if (translationState.status === 'loading') {
    return <TranslationLoading />
  }

  if (translationState.status === 'success') {
    return (
      <TranslationResult
        translate={translate}
        postText={postText}
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
    <View style={[a.gap_md, a.pt_md, a.align_start]}>
      <View style={[a.flex_row, a.align_center, a.gap_xs]}>
        <Loader size="xs" />
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>Translating…</Trans>
        </Text>
      </View>
    </View>
  )
}

function TranslationResult({
  translate,
  postText,
  sourceLanguage,
  translatedText,
}: {
  translate: TranslationFunction
  postText: string
  sourceLanguage: string | null
  translatedText: string
}) {
  const t = useTheme()
  const {i18n} = useLingui()

  const langName = sourceLanguage
    ? codeToLanguageName(sourceLanguage, i18n.locale)
    : undefined

  return (
    <View style={[a.py_xs, a.gap_xs, a.mt_sm]}>
      <View style={[a.flex_row, a.align_center]}>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {langName ? (
            <Trans>Translated from {langName}</Trans>
          ) : (
            <Trans>Translated</Trans>
          )}
        </Text>
        {sourceLanguage != null && (
          <>
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              {' '}
              &middot;{' '}
            </Text>
            <TranslationLanguageSelect
              sourceLanguage={sourceLanguage}
              translate={translate}
              postText={postText}
            />
          </>
        )}
      </View>
      <Text emoji selectable style={[a.text_md, a.leading_snug]}>
        {translatedText}
      </Text>
    </View>
  )
}

function TranslationLanguageSelect({
  translate,
  postText,
  sourceLanguage,
}: {
  translate: TranslationFunction
  postText: string
  sourceLanguage: string
}) {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const langPrefs = useLanguagePrefs()

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
    void translate({
      text: postText,
      targetLangCode: langPrefs.primaryLanguage,
      sourceLangCode,
    })
  }

  return (
    <Select.Root
      value={sourceLanguage}
      onValueChange={handleChangeTranslationLanguage}>
      <Select.Trigger label={l`Change the source language`}>
        {({props}) => {
          return (
            <Button
              label={props.accessibilityLabel}
              {...props}
              hitSlop={HITSLOP_30}
              hoverStyle={native({opacity: 0.5})}>
              <Text style={[a.text_xs]}>
                <Trans>Change</Trans>
              </Text>
            </Button>
          )
        }}
      </Select.Trigger>
      <Select.Content
        label={l`Select the source language`}
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
