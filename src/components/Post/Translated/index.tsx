import {View} from 'react-native'
import {Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {codeToLanguageName} from '#/locale/helpers'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useTranslateOnDevice} from '#/translation/useTranslateOnDevice'

export function TranslatedPost({
  postUri,
  hideLoading = false,
}: {
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
        translatedText={translationState.translatedText}
        sourceLanguage={translationState.sourceLanguage}
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
  translatedText,
  sourceLanguage,
}: {
  translatedText: string
  sourceLanguage: string | null
}) {
  const t = useTheme()
  const {i18n} = useLingui()

  const langName = sourceLanguage
    ? codeToLanguageName(sourceLanguage, i18n.locale)
    : undefined

  return (
    <View style={[a.py_xs, a.gap_xs, a.mt_sm]}>
      <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
        {langName ? (
          <Trans>Translated from {langName}</Trans>
        ) : (
          <Trans>Translated</Trans>
        )}
      </Text>
      <Text selectable style={[a.text_md]}>
        {translatedText}
      </Text>
    </View>
  )
}
