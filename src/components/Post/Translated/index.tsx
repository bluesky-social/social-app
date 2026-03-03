import {useCallback, useMemo} from 'react'
import {type GestureResponderEvent, Platform, View} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_30} from '#/lib/constants'
import {useTranslate} from '#/lib/translation'
import {type TranslationFunction} from '#/lib/translation/types'
import {
  codeToLanguageName,
  getTranslatorLink,
  isPostInLanguage,
  languageName,
} from '#/locale/helpers'
import {LANGUAGES} from '#/locale/languages'
import {useLanguagePrefs} from '#/state/preferences'
import {atoms as a, native, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRight} from '#/components/icons/Arrow'
import {TimesLarge_Stroke2_Corner0_Rounded as Times} from '#/components/icons/Times'
import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Select from '#/components/Select'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

export function TranslatedPost({
  post,
  postText,
}: {
  post: AppBskyFeedDefs.PostView
  postText: string
}) {
  const langPrefs = useLanguagePrefs()
  const {clearTranslation, translate, translationState} = useTranslate({
    key: post.uri,
  })

  const needsTranslation = useMemo(
    () =>
      Boolean(
        langPrefs.primaryLanguage &&
          !isPostInLanguage(post, [langPrefs.primaryLanguage]),
      ),
    [post, langPrefs.primaryLanguage],
  )

  if (translationState.status === 'error') {
    return (
      <TranslationError
        clearTranslation={clearTranslation}
        message={translationState.message}
        postText={postText}
        primaryLanguage={langPrefs.primaryLanguage}
      />
    )
  }

  if (translationState.status === 'loading') {
    return <TranslationLoading />
  }

  if (translationState.status === 'success') {
    return (
      <TranslationResult
        clearTranslation={clearTranslation}
        translate={translate}
        postText={postText}
        sourceLanguage={translationState.sourceLanguage}
        translatedText={translationState.translatedText}
      />
    )
  }

  return (
    needsTranslation && (
      <TranslationLink
        postText={postText}
        primaryLanguage={langPrefs.primaryLanguage}
        translate={translate}
      />
    )
  )
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

function TranslationLink({
  postText,
  primaryLanguage,
  translate,
}: {
  postText: string
  primaryLanguage: string
  translate: TranslationFunction
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()

  const handleTranslate = useCallback(
    (e: GestureResponderEvent) => {
      e.preventDefault()
      void translate({
        text: postText,
        targetLangCode: primaryLanguage,
      })

      ax.metric('translate', {
        sourceLanguages: [],
        targetLanguage: primaryLanguage,
        textLength: postText.length,
      })

      return false
    },
    [ax, postText, primaryLanguage, translate],
  )

  return (
    <View style={[a.gap_md, a.pt_md, a.align_start]}>
      <View style={[a.flex_row, a.align_center, a.gap_xs]}>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <InlineLinkText
            // Overridden to open an intent on android, but keep as anchor tag
            // for accessibility
            to={getTranslatorLink(postText, primaryLanguage)}
            label={l`Translate`}
            onPress={handleTranslate}>
            <Trans>Translate</Trans>
          </InlineLinkText>
        </Text>
      </View>
    </View>
  )
}

function TranslationError({
  clearTranslation,
  message,
  postText,
  primaryLanguage,
}: {
  clearTranslation: () => void
  message: string
  postText: string
  primaryLanguage: string
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <View
      style={[
        a.px_lg,
        a.py_md,
        a.mt_sm,
        a.border,
        a.rounded_lg,
        t.atoms.border_contrast_high,
      ]}>
      <View
        style={[a.flex_row, a.flex_wrap, a.align_center, a.justify_between]}>
        <View style={[a.flex_row, a.align_center, a.mb_sm]}>
          <Warning size="sm" fill={t.atoms.text_contrast_medium.color} />
          <Text style={[a.text_xs, a.font_medium, t.atoms.text_contrast_high]}>
            {' '}
            {message}
          </Text>
        </View>
        <View style={[a.flex_row, a.align_center, a.mb_xs]}>
          <Button
            label={l`Hide translation`}
            hitSlop={HITSLOP_30}
            hoverStyle={native({opacity: 0.5})}
            onPress={clearTranslation}>
            <Times size="sm" fill={t.atoms.text_contrast_medium.color} />
          </Button>
        </View>
      </View>
      <View style={[a.flex_row, a.align_center]}>
        <Text>
          <InlineLinkText
            to={getTranslatorLink(postText, primaryLanguage)}
            label={l`Try Google Translate`}
            style={[a.text_xs, a.font_medium]}>
            <Trans>Try Google Translate</Trans>
          </InlineLinkText>
        </Text>
      </View>
    </View>
  )
}

function TranslationResult({
  clearTranslation,
  translate,
  postText,
  sourceLanguage,
  translatedText,
}: {
  clearTranslation: () => void
  translate: TranslationFunction
  postText: string
  sourceLanguage: string | null
  translatedText: string
}) {
  const t = useTheme()
  const langPrefs = useLanguagePrefs()
  const {i18n, t: l} = useLingui()

  const langName = sourceLanguage
    ? codeToLanguageName(sourceLanguage, i18n.locale)
    : undefined

  return (
    <View>
      <View
        style={[
          a.px_lg,
          a.pt_sm,
          a.pb_md,
          a.mt_sm,
          a.border,
          a.rounded_lg,
          t.atoms.border_contrast_high,
        ]}>
        <View style={[a.flex_row, a.align_center, a.mb_xs]}>
          {langName ? (
            <View style={[a.flex_row, a.align_center]}>
              <Text
                style={[
                  a.text_xs,
                  a.font_medium,
                  t.atoms.text_contrast_medium,
                ]}>
                {langName}{' '}
              </Text>
              <View>
                <ArrowRight
                  size="sm"
                  fill={t.atoms.text_contrast_medium.color}
                />
              </View>
              <Text
                style={[
                  a.text_xs,
                  a.font_medium,
                  t.atoms.text_contrast_medium,
                ]}>
                {' '}
                {codeToLanguageName(
                  langPrefs.primaryLanguage,
                  langPrefs.appLanguage,
                )}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                a.text_xs,
                a.font_medium,
                t.atoms.text_contrast_medium,
                a.mb_xs,
              ]}>
              <Trans>Translated</Trans>
            </Text>
          )}
          {sourceLanguage != null && (
            <>
              <Text
                style={[
                  a.text_xs,
                  a.font_medium,
                  t.atoms.text_contrast_medium,
                ]}>
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
        <Button
          label={l`Hide translation`}
          hitSlop={HITSLOP_30}
          hoverStyle={native({opacity: 0.5})}
          style={[a.absolute, a.z_10, {top: 12, right: 14}]}
          onPress={clearTranslation}>
          <Times size="sm" fill={t.atoms.text_contrast_medium.color} />
        </Button>
      </View>
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
  const t = useTheme()
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
              <Text
                style={[a.text_xs, a.font_medium, t.atoms.text_contrast_high]}>
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
