import {useCallback, useMemo} from 'react'
import {Platform, type StyleProp, type TextStyle, View} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_30} from '#/lib/constants'
import {useGoogleTranslate} from '#/lib/hooks/useGoogleTranslate'
import {useTranslate} from '#/lib/translation'
import {type TranslationFunction} from '#/lib/translation'
import {
  codeToLanguageName,
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

const X_ICON_OFFSET = 16

export function TranslatedPost({
  hideTranslateLink = false,
  post,
  postText,
  postTextStyle = a.text_md,
}: {
  hideTranslateLink?: boolean
  post: AppBskyFeedDefs.PostView
  postText: string
  postTextStyle?: StyleProp<TextStyle>
}) {
  const langPrefs = useLanguagePrefs()
  const {clearTranslation, translate, translationState} = useTranslate({
    key: post.uri,
  })

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
          clearTranslation={clearTranslation}
          translate={translate}
          postText={postText}
          postTextStyle={postTextStyle}
          sourceLanguage={
            translationState.sourceLanguage ?? null // Fallback primarily for iOS
          }
          translatedText={translationState.translatedText}
        />
      )
    case 'error':
      return (
        <TranslationError
          clearTranslation={clearTranslation}
          message={translationState.message}
          postText={postText}
          primaryLanguage={langPrefs.primaryLanguage}
        />
      )
    default:
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

  const handleTranslate = useCallback(() => {
    void translate({
      text: postText,
      targetLangCode: primaryLanguage,
    })

    ax.metric('translate', {
      sourceLanguages: [], // todo: get from post maybe?
      targetLanguage: primaryLanguage,
      textLength: postText.length,
    })
  }, [ax, postText, primaryLanguage, translate])

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
  const translate = useGoogleTranslate()

  const handleFallback = () => {
    void translate(postText, primaryLanguage)
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
  postText,
  postTextStyle,
  sourceLanguage,
  translatedText,
}: {
  clearTranslation: () => void
  translate: TranslationFunction
  postText: string
  postTextStyle?: StyleProp<TextStyle>
  sourceLanguage: string | null
  translatedText: string
}) {
  const t = useTheme()
  const langPrefs = useLanguagePrefs()
  const {i18n, t: l} = useLingui()

  const langName = sourceLanguage
    ? codeToLanguageName(sourceLanguage, i18n.locale)
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
          {sourceLanguage != null && (
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
                sourceLanguage={sourceLanguage}
                translate={translate}
                postText={postText}
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
        .sort((a, b) => {
          // Prioritize sourceLanguage at the top
          if (a.code2 === sourceLanguage) return -1
          if (b.code2 === sourceLanguage) return 1
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
    [langPrefs, sourceLanguage],
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
