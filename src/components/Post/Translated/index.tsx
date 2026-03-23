import {useCallback, useMemo} from 'react'
import {Platform, type StyleProp, type TextStyle, View} from 'react-native'
import {type AppBskyFeedDefs, AppBskyFeedPost} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_30} from '#/lib/constants'
import {useTranslate} from '#/lib/translation'
import {
  type TranslationFunction,
  type TranslationFunctionParams,
} from '#/lib/translation'
import {
  codeToLanguageName,
  getPostLanguageTags,
  isPostInLanguage,
  languageName,
} from '#/locale/helpers'
import {LANGUAGES} from '#/locale/languages'
import {useLanguagePrefs} from '#/state/preferences'
import {atoms as a, flatten, native, useTheme, web} from '#/alf'
import {Button} from '#/components/Button'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {createStaticClick, Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Select from '#/components/Select'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import * as bsky from '#/types/bsky'

const X_ICON_OFFSET = 16

export function TranslatedPost({
  hideTranslateLink = false,
  post,
  postTextStyle = a.text_md,
}: {
  hideTranslateLink?: boolean
  post: AppBskyFeedDefs.PostView
  postTextStyle?: StyleProp<TextStyle>
}) {
  const langPrefs = useLanguagePrefs()
  const {clearTranslation, translate, translationState} = useTranslate({
    key: post.uri,
  })

  const record = useMemo<AppBskyFeedPost.Record | undefined>(() => {
    return bsky.dangerousIsType<AppBskyFeedPost.Record>(
      post.record,
      AppBskyFeedPost.isRecord,
    )
      ? post.record
      : undefined
  }, [post])
  const initialTranslationParams = useMemo<TranslationFunctionParams>(() => {
    return {
      text: record?.text || '',
      expectedTargetLanguage: langPrefs.primaryLanguage,
      possibleSourceLanguages: getPostLanguageTags(post),
    }
  }, [post, record, langPrefs])
  const needsTranslation = useMemo(() => {
    if (hideTranslateLink) return false
    return !isPostInLanguage(post, [langPrefs.primaryLanguage])
  }, [hideTranslateLink, post, langPrefs.primaryLanguage])

  switch (translationState.status) {
    case 'loading':
      return <TranslationLoading />
    case 'success':
      return (
        <TranslationResult
          translate={translate}
          clearTranslation={clearTranslation}
          initialTranslationParams={initialTranslationParams}
          postTextStyle={postTextStyle}
          resultSourceLanguage={
            translationState.sourceLanguage ?? null // Fallback primarily for iOS
          }
          translatedText={translationState.translatedText}
        />
      )
    case 'error':
      return (
        <TranslationError
          translate={translate}
          clearTranslation={clearTranslation}
          message={translationState.message}
          initialTranslationParams={initialTranslationParams}
        />
      )
    default:
      return (
        needsTranslation && (
          <TranslationLink
            translate={translate}
            initialTranslationParams={initialTranslationParams}
          />
        )
      )
  }
}

function TranslationLoading() {
  const t = useTheme()

  return (
    <View style={[a.gap_md, a.mt_sm, a.align_start]}>
      <View style={[a.flex_row, a.align_center, a.gap_xs]}>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>Translating</Trans>
        </Text>
        <Loader size="xs" fill={t.atoms.text_contrast_medium.color} />
      </View>
    </View>
  )
}

function TranslationLink({
  translate,
  initialTranslationParams,
}: {
  translate: TranslationFunction
  initialTranslationParams: TranslationFunctionParams
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const handleTranslate = useCallback(() => {
    void translate(initialTranslationParams)
  }, [initialTranslationParams, translate])

  return (
    <View
      style={[
        a.gap_md,
        a.mt_sm,
        a.align_start,
        a.flex_row,
        a.align_center,
        a.gap_xs,
      ]}>
      <Link
        role={IS_WEB ? 'link' : 'button'}
        {...createStaticClick(() => {
          handleTranslate()
        })}
        label={l`Translate`}
        hoverStyle={[
          native({opacity: 0.5}),
          web([a.underline, {textDecorationColor: t.palette.primary_500}]),
        ]}
        hitSlop={HITSLOP_30}>
        <Text style={[a.text_sm, {color: t.palette.primary_500}]}>
          <Trans>Translate</Trans>
        </Text>
      </Link>
    </View>
  )
}

function TranslationError({
  translate,
  clearTranslation,
  message,
  initialTranslationParams,
}: {
  translate: TranslationFunction
  clearTranslation: () => void
  message: string
  initialTranslationParams: TranslationFunctionParams
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const handleFallback = () => {
    void translate({
      ...initialTranslationParams,
      forceGoogleTranslate: true,
    })
  }

  return (
    <View
      style={[
        a.p_md,
        a.mt_sm,
        a.border,
        a.rounded_lg,
        a.gap_xs,
        t.atoms.border_contrast_high,
      ]}>
      <View
        style={[
          a.flex_row,
          a.align_start,
          a.gap_xs,
          {
            paddingRight: X_ICON_OFFSET,
          },
        ]}>
        <WarningIcon size="sm" fill={t.atoms.text_contrast_medium.color} />
        <Text
          style={[
            a.flex_1,
            a.text_xs,
            a.leading_snug,
            t.atoms.text_contrast_high,
          ]}>
          {message}
        </Text>

        <Button
          label={l`Hide translation`}
          hitSlop={HITSLOP_30}
          hoverStyle={native({opacity: 0.5})}
          style={[a.absolute, a.z_10, {top: 0, right: 0}]}
          onPress={clearTranslation}>
          <XIcon size="sm" fill={t.atoms.text_contrast_medium.color} />
        </Button>
      </View>
      <View style={[a.flex_row, a.align_center]}>
        <Link
          {...createStaticClick(() => {
            handleFallback()
          })}
          label={l`Try Google Translate`}
          hoverStyle={[
            native({opacity: 0.5}),
            web([a.underline, {textDecorationColor: t.palette.primary_500}]),
          ]}
          hitSlop={HITSLOP_30}>
          <Text
            style={[
              a.text_xs,
              a.font_medium,
              a.leading_snug,
              {color: t.palette.primary_500},
            ]}>
            <Trans>Try Google Translate</Trans>
          </Text>
        </Link>
      </View>
    </View>
  )
}

function TranslationResult({
  clearTranslation,
  translate,
  postTextStyle,
  resultSourceLanguage,
  translatedText,
  initialTranslationParams,
}: {
  clearTranslation: () => void
  translate: TranslationFunction
  postTextStyle?: StyleProp<TextStyle>
  resultSourceLanguage: string | null
  translatedText: string
  initialTranslationParams: TranslationFunctionParams
}) {
  const t = useTheme()
  const langPrefs = useLanguagePrefs()
  const {i18n, t: l} = useLingui()

  const langName = resultSourceLanguage
    ? codeToLanguageName(resultSourceLanguage, i18n.locale)
    : undefined

  const flattenedStyle = flatten(postTextStyle) ?? {}
  const fontSize = flattenedStyle.fontSize

  return (
    <View>
      <View
        style={[
          a.p_md,
          a.mt_sm,
          a.border,
          a.rounded_lg,
          a.gap_xs,
          t.atoms.border_contrast_high,
        ]}>
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.flex_wrap,
            {
              paddingRight: X_ICON_OFFSET,
            },
          ]}>
          {langName ? (
            <>
              <Text
                style={[
                  a.text_xs,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                {langName}{' '}
              </Text>
              <ArrowRightIcon
                size="xs"
                fill={t.atoms.text_contrast_medium.color}
              />
              <Text
                style={[
                  a.text_xs,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                {' '}
                {codeToLanguageName(
                  langPrefs.primaryLanguage,
                  langPrefs.appLanguage,
                )}
              </Text>
            </>
          ) : (
            <Text
              style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
              <Trans>Translated</Trans>
            </Text>
          )}
          {resultSourceLanguage != null && (
            <>
              <Text
                style={[
                  a.text_xs,
                  a.font_medium,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                {' '}
                &middot;{' '}
              </Text>
              <TranslationLanguageSelect
                resultSourceLanguage={resultSourceLanguage}
                translate={translate}
                initialTranslationParams={initialTranslationParams}
              />
            </>
          )}

          <Button
            label={l`Hide translation`}
            hitSlop={HITSLOP_30}
            hoverStyle={native({opacity: 0.5})}
            style={[a.absolute, a.z_10, {top: 0, right: 0}]}
            onPress={clearTranslation}>
            <XIcon size="sm" fill={t.atoms.text_contrast_medium.color} />
          </Button>
        </View>
        <Text emoji selectable style={[a.leading_snug, {fontSize}]}>
          {translatedText}
        </Text>
      </View>
    </View>
  )
}

function TranslationLanguageSelect({
  translate,
  resultSourceLanguage,
  initialTranslationParams,
}: {
  translate: TranslationFunction
  resultSourceLanguage: string
  initialTranslationParams: TranslationFunctionParams
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
        .sort((a, b) => {
          // Prioritize sourceLanguage at the top
          if (a.code2 === resultSourceLanguage) return -1
          if (b.code2 === resultSourceLanguage) return 1
          // Localized sort
          return languageName(a, langPrefs.appLanguage).localeCompare(
            languageName(b, langPrefs.appLanguage),
            langPrefs.appLanguage,
          )
        })
        .map(l => ({
          label: languageName(l, langPrefs.appLanguage), // The viewer may not be familiar with the source language, so localize the name
          value: l.code2,
        })),
    [langPrefs, resultSourceLanguage],
  )

  const handleChangeTranslationLanguage = (sourceLangCode: string) => {
    ax.metric('translate:override', {
      os: Platform.OS,
      possibleSourceLanguages: initialTranslationParams.possibleSourceLanguages,
      expectedSourceLanguage: sourceLangCode,
      expectedTargetLanguage: initialTranslationParams.expectedTargetLanguage,
      resultSourceLanguage,
    })
    void translate({
      text: initialTranslationParams.text,
      expectedTargetLanguage: initialTranslationParams.expectedTargetLanguage,
      expectedSourceLanguage: sourceLangCode,
      possibleSourceLanguages: initialTranslationParams.possibleSourceLanguages,
    })
  }

  return (
    <Select.Root
      value={resultSourceLanguage}
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
                style={[
                  a.text_xs,
                  a.font_medium,
                  a.leading_snug,
                  t.atoms.text_contrast_high,
                ]}>
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
