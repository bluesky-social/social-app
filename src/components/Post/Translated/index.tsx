import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {codeToLanguageName} from '#/locale/helpers'
import {APP_LANGUAGES} from '#/locale/languages'
import {useLanguagePrefs} from '#/state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import * as Select from '#/components/Select'
import {Text} from '#/components/Typography'
import {useTranslateOnDevice} from '#/translation/useTranslateOnDevice'

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
          )}{' '}
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            &middot;
          </Text>{' '}
          {sourceLanguage != null && (
            <TranslationLanguageSelect
              postUri={postUri}
              sourceLanguage={sourceLanguage}
              postText={postText}
            />
          )}
        </Text>
        <Text selectable style={[a.text_md]}>
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
  const {_} = useLingui()
  const langPrefs = useLanguagePrefs()
  const {translate} = useTranslateOnDevice(postUri)

  const handleChangeTranslationLanguage = (sourceLangCode: string) => {
    void translate(postText, langPrefs.primaryLanguage, sourceLangCode)
  }

  return (
    <Select.Root
      value={sourceLanguage}
      onValueChange={handleChangeTranslationLanguage}>
      <Select.Trigger label={_(msg`Change translation language`)}>
        {({props}) => {
          return (
            <Text {...props} style={[a.text_xs]}>
              <Trans>Edit</Trans>
            </Text>
          )
        }}
      </Select.Trigger>
      <Select.Content
        label={_(msg`Select language`)}
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
  )
}
