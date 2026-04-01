import {useEffect, useState} from 'react'
import {Platform, Text as RNText, View} from 'react-native'
import {parseLanguageString} from '@atproto/syntax'
import {guessLanguageAsync} from '@bsky.app/expo-guess-language'
import {Trans, useLingui} from '@lingui/react/macro'
import lande from 'lande'

import {deviceLanguageCodes} from '#/locale/deviceLocales'
import {code3ToCode2Strict, codeToLanguageName} from '#/locale/helpers'
import {useLanguagePrefs} from '#/state/preferences/languages'
import {atoms as a, platform, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Earth_Stroke2_Corner2_Rounded as EarthIcon} from '#/components/icons/Globe'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'

// fallbacks for safari
const onIdle =
  globalThis.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1))
const cancelIdle = globalThis.cancelIdleCallback || clearTimeout

// harsher threshold for web as the model is worse
const MIN_TEXT_LENGTH = IS_WEB ? 40 : 10
// Noise floor for candidates. Device locales get a lower bar so they
// survive into the candidate list more easily. since we discard if
// multiple candidates are above the noise floor, we want to allow more
// candidates in if they might be in the device locales
const MIN_CANDIDATE_CONFIDENCE = IS_WEB ? 0.0002 : 0.1
const MIN_CANDIDATE_CONFIDENCE_DEVICE_LOCALE = IS_WEB ? 0.0002 : 0.001

// Confidence required to accept the top candidate.
// Lower bar for device locales — the user is more likely writing
// in a language they have installed on their device.
const CONFIDENCE_THRESHOLD = platform({
  web: 0.97,
  ios: 0.9,
  android: 0.9,
  default: 0.97,
})

const CONFIDENCE_THRESHOLD_DEVICE_LOCALE = platform({
  web: 0.97,
  ios: 0.8,
  android: 0.8,
  default: 0.97,
})

export function SuggestedLanguage({
  text,
  replyToLanguages: replyToLanguagesProp,
  currentLanguages,
  onAcceptSuggestedLanguage,
}: {
  text: string
  /**
   * All languages associated with the post being replied to.
   */
  replyToLanguages: string[]
  /**
   * All languages currently selected for the post being composed.
   */
  currentLanguages: string[]
  /**
   * Called when the user accepts a suggested language. We only pass a single
   * language here. If the post being replied to has multiple languages, we
   * only suggest the first one.
   */
  onAcceptSuggestedLanguage: (language: string | null) => void
}) {
  const ax = useAnalytics()
  const langPrefs = useLanguagePrefs()
  const replyToLanguages = replyToLanguagesProp
    .map(lang => cleanUpLanguage(lang))
    .filter(Boolean) as string[]
  const [hasInteracted, setHasInteracted] = useState(false)
  const [suggestedLanguage, setSuggestedLanguage] = useState<
    string | undefined
  >(undefined)
  const [declined, setHasDeclined] = useState(false)

  const onAccept = (language: string | null) => {
    const textTrimmed = text.trim()
    ax.metric('translate:acceptSuggestion', {
      os: Platform.OS,
      suggestedLanguage: language ?? undefined,
      expectedTargetLanguage: langPrefs.primaryLanguage,
      textLength: textTrimmed.length,
    })
    onAcceptSuggestedLanguage(language)
  }

  const onDecline = () => {
    const textTrimmed = text.trim()
    ax.metric('translate:declineSuggestion', {
      os: Platform.OS,
      suggestedLanguage,
      expectedTargetLanguage: langPrefs.primaryLanguage,
      textLength: textTrimmed.length,
    })
    setHasDeclined(true)
  }

  useEffect(() => {
    // show reply prompt if there's not enough text to start using the model
    if (text.length > MIN_TEXT_LENGTH && !hasInteracted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasInteracted(true)
    }
  }, [text, hasInteracted])

  useEffect(() => {
    const textTrimmed = text.trim()

    const enableNativeDetection = ax.features.enabled(
      ax.features.NativeLanguageDetectionEnable,
    )

    // Don't run the language model on small posts, the results are likely
    // to be inaccurate anyway.
    if (textTrimmed.length < MIN_TEXT_LENGTH) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestedLanguage(undefined)
      return
    }

    const idle = onIdle(
      () =>
        void guessLanguage(textTrimmed, enableNativeDetection).then(
          language => {
            ax.metric('translate:suggestLanguage', {
              os: Platform.OS,
              suggestedLanguage: language,
              expectedTargetLanguage: langPrefs.primaryLanguage,
              textLength: textTrimmed.length,
            })
            setSuggestedLanguage(language)
          },
        ),
    )

    return () => cancelIdle(idle)
  }, [ax, ax.features, langPrefs.primaryLanguage, suggestedLanguage, text])

  /*
   * We've detected a language, and the user hasn't already selected it.
   */
  const hasLanguageSuggestion =
    suggestedLanguage && !currentLanguages.includes(suggestedLanguage)
  /*
   * We have not detected a different language, and the user is not already
   * using or has not already selected one of the languages of the post they
   * are replying to.
   */
  const hasSuggestedReplyLanguage =
    !hasInteracted &&
    !suggestedLanguage &&
    replyToLanguages.length &&
    !replyToLanguages.some(l => currentLanguages.includes(l))

  if (declined) {
    return null
  }

  if (hasLanguageSuggestion) {
    const suggestedLanguageName = codeToLanguageName(
      suggestedLanguage,
      langPrefs.appLanguage,
    )

    return (
      <LanguageSuggestionButton
        label={
          <RNText>
            <Trans>
              Are you writing in{' '}
              <Text style={[a.font_bold]}>{suggestedLanguageName}</Text>?
            </Trans>
          </RNText>
        }
        value={suggestedLanguage}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    )
  } else if (hasSuggestedReplyLanguage) {
    const suggestedLanguageName = codeToLanguageName(
      replyToLanguages[0],
      langPrefs.appLanguage,
    )

    return (
      <LanguageSuggestionButton
        label={
          <RNText>
            <Trans>
              The post you're replying to was marked as being written in{' '}
              {suggestedLanguageName} by its author. Would you like to reply in{' '}
              <Text style={[a.font_bold]}>{suggestedLanguageName}</Text>?
            </Trans>
          </RNText>
        }
        value={replyToLanguages[0]}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    )
  } else {
    return null
  }
}

function LanguageSuggestionButton({
  label,
  value,
  onAccept,
  onDecline,
}: {
  label: React.ReactNode
  value: string
  onAccept: (language: string | null) => void
  onDecline: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <View style={[a.px_lg, a.py_sm]}>
      <View
        style={[
          a.gap_md,
          a.border,
          a.flex_row,
          a.align_center,
          a.rounded_sm,
          a.p_md,
          a.pl_lg,
          t.atoms.bg,
          t.atoms.border_contrast_low,
        ]}>
        <EarthIcon />
        <View style={[a.flex_1]}>
          <Text
            style={[
              a.leading_snug,
              {
                maxWidth: 400,
              },
            ]}>
            {label}
          </Text>
        </View>

        <Button
          size="small"
          color="primary_subtle"
          onPress={() => onAccept(value)}
          label={l`Accept this language suggestion`}>
          <ButtonIcon icon={CheckIcon} size="sm" />
        </Button>

        <Button
          size="small"
          color="secondary"
          onPress={() => onDecline()}
          label={l`Reject this language suggestion`}>
          <ButtonIcon icon={XIcon} size="sm" />
        </Button>
      </View>
    </View>
  )
}

/**
 * This function uses the expo-guess-language module to attempt to detect the language.
 * We want to only make suggestions when we feel a high degree of certainty.
 * The magic numbers are based on debugging sessions against some test strings.
 */
async function guessLanguage(
  text: string,
  enableNativeDetection: boolean,
): Promise<string | undefined> {
  if (enableNativeDetection) {
    const results = await guessLanguageAsync(text)

    // Filter candidates above the noise floor. Device locales get a lower
    // bar so they're less likely to be pruned as noise.
    const scores = results.filter(r => {
      const minConfidence = deviceLanguageCodes.includes(r.language)
        ? MIN_CANDIDATE_CONFIDENCE_DEVICE_LOCALE
        : MIN_CANDIDATE_CONFIDENCE
      return r.confidence >= minConfidence
    })

    if (scores.length === 0) return undefined

    const {language, confidence} = scores[0]
    const isDeviceLocale = deviceLanguageCodes.includes(language)
    const threshold = isDeviceLocale
      ? CONFIDENCE_THRESHOLD_DEVICE_LOCALE
      : CONFIDENCE_THRESHOLD

    // Multiple candidates above the noise floor - ignore due to uncertainty
    if (scores.length > 1) {
      return undefined
    }

    if (confidence < threshold) return undefined
    return language
  } else {
    // LEGACY BEHAVIOUR
    const scores = lande(text).filter(([_lang, value]) => value >= 0.0002)
    // if the model has multiple items with a score higher than 0.0002, it isn't certain enough
    if (scores.length !== 1) {
      return undefined
    }
    const [lang, value] = scores[0]
    // if the model doesn't give a score of 0.97 or above, it isn't certain enough
    if (value < 0.97) {
      return undefined
    }
    return code3ToCode2Strict(lang)
  }
}

function cleanUpLanguage(text: string | undefined): string | undefined {
  if (!text) {
    return undefined
  }

  return parseLanguageString(text)?.language
}
