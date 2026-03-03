import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {codeToLanguageName} from '#/locale/helpers'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useTranslateOnDevice} from '#/features/translation'
import {TranslationLanguageSelect} from './TranslationLanguageSelect'

export function TranslationResult({
  postText,
  hideLoading = false,
}: {
  postText: string
  hideLoading: boolean
}) {
  const {translationState} = useTranslateOnDevice()

  if (translationState.status === 'loading' && !hideLoading) {
    return <TranslationLoading />
  }

  if (translationState.status === 'success') {
    return (
      <TranslationSuccess
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
    <View style={[a.flex_row, a.align_center, a.gap_sm, a.py_xs]}>
      <Loader size="sm" />
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        <Trans>Translating…</Trans>
      </Text>
    </View>
  )
}

function TranslationSuccess({
  postText,
  sourceLanguage,
  translatedText,
}: {
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
