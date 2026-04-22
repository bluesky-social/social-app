import {useEffect, useMemo, useRef, useState} from 'react'
import {Platform, Text as RNText, View} from 'react-native'
import {RichText} from '@atproto/api'
import {parseLanguageString} from '@atproto/syntax'
import {
  guessLanguageAsync,
  type LanguageResult,
} from '@bsky.app/expo-guess-language'
import {Trans, useLingui} from '@lingui/react/macro'
import debounce from 'lodash.debounce'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useNonReactiveObject} from '#/lib/hooks/useNonReactiveObject'
import {deviceLanguageCodes} from '#/locale/deviceLocales'
import {codeToLanguageName} from '#/locale/helpers'
import {useLanguagePrefs} from '#/state/preferences/languages'
import {atoms as a, platform, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Earth_Stroke2_Corner2_Rounded as EarthIcon} from '#/components/icons/Globe'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'

type LanguageDetectionPerLanguageConfig = {
  acceptanceThreshold?: number
  deviceLocaleAcceptanceThreshold?: number
}

type LanguageDetectionConfig = {
  acceptanceThreshold: number
  deviceLocaleAcceptanceThreshold: number
  overrides: Record<string, LanguageDetectionPerLanguageConfig>
}

const MIN_TEXT_LENGTH = IS_WEB ? 20 : 10
const NOISE_FLOOR = 0.1

/**
 * Platform-resolved defaults. Web uses `lande` under the hood, which
 * spreads probability across many candidates — so both the noise floor
 * and the acceptance bar sit higher than on native (MLKit).
 *
 * Per-language carve-outs override the platform-level acceptance
 * threshold.
 */
const DEFAULT_CONFIG: LanguageDetectionConfig = {
  acceptanceThreshold: platform({
    web: 0.97,
    ios: 0.9,
    android: 0.9,
    default: 0.97,
  }),
  /*
   * Device locales are an independent prior — the OS tells us which
   * languages the user has installed, separate from what the model sees
   * in the text. Combining the two lets us accept a candidate at lower
   * model confidence when the language is one the user actually reads.
   * It also fails softer: a wrong suggestion for a language the user
   * knows ("are you writing in Spanish?") is easier to dismiss than one
   * for a language they don't ("are you writing in Japanese?"), so we
   * can afford to be more aggressive there.
   *
   * Native-only. On web we keep the bar at 0.97 because (a) lande's
   * confidence is tightly bimodal — a score of 0.85 means the model
   * doesn't know, not that it's "mostly sure" — and (b) the browser's
   * locale signal is noisier (navigator.languages usually includes
   * English regardless of what the user actually reads).
   */
  deviceLocaleAcceptanceThreshold: platform({
    web: 0.97,
    ios: 0.8,
    android: 0.8,
    default: 0.97,
  }),
  /*
   * Per-language carve-outs for known confusable pairs / clusters. The
   * acceptance bar is raised above the platform baseline because these
   * are languages the detector (especially `lande` on web) is known to
   * misclassify or over-commit on.
   *
   * The device-locale bar is also raised for most tightly-confusable
   * pairs: if the user has both languages in the pair installed (common
   * for id/ms or nb/da speakers), the device-locale prior no longer
   * discriminates between them, so we can't afford to drop the bar as
   * aggressively.
   *
   * Each value uses `platform({web, default})` — `default` applies to
   * iOS/Android/etc. (MLKit is better at these distinctions, so the
   * bump above baseline is smaller).
   */
  overrides: {
    // Example
    // id: {
    //   acceptanceThreshold: platform({web: 0.99, default: 0.95}),
    //   deviceLocaleAcceptanceThreshold: platform({web: 0.97, default: 0.9}),
    // },
  },
}

export function SuggestedLanguage({
  text,
  replyToLanguages: replyToLanguagesProp,
  currentLanguages,
  onAcceptSuggestedLanguage,
  onNudge,
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
  /**
   * Fired when detection produced ambiguous results — no strong suggestion
   * to show, but we want to hint to the user that the detector is unsure.
   * Expected to be an incrementing counter setter on the parent so the
   * nudge can re-fire on each detection cycle.
   */
  onNudge?: () => void
}) {
  const ax = useAnalytics()
  const [hasInteracted, setHasInteracted] = useState(false)
  const [suggLang, setSuggLang] = useState<string | undefined>(undefined)
  const declinedSuggLangsRef = useRef<string[]>([])

  /*
   * Shared callbacks
   */
  const onAccept = (language: string) => {
    onAcceptSuggestedLanguage(language)
    // clear
    setSuggLang(undefined)
  }
  const onDecline = () => {
    if (suggLang) {
      declinedSuggLangsRef.current.push(suggLang)
      // clear
      setSuggLang(undefined)
    }
  }

  /**
   * Merge in remote config (eventually)
   */
  const config = useMemo(() => DEFAULT_CONFIG, [])

  /**
   * Create non-reactive ref for debounced detection method.
   */
  const detectionPropsRef = useNonReactiveObject({
    config,
    currentLanguages,
  })

  /*
   * Held in a ref so the debounced detection closure always sees the
   * latest callback identity without rebuilding the debounce timer.
   */
  const handleOnNudge = useNonReactiveCallback(onNudge)

  /*
   * Main language detection effect
   */
  const detectLanguage = useMemo(() => {
    return debounce(async (text: string) => {
      try {
        const currLangs = detectionPropsRef.current.currentLanguages
        const {certain, uncertain} = await guessLanguage(
          text,
          detectionPropsRef.current.config,
        )
        const topCandidate = certain.at(0)?.language
        if (
          certain.length === 1 &&
          uncertain.length === 0 &&
          topCandidate !== undefined &&
          !currLangs.includes(topCandidate) &&
          !declinedSuggLangsRef.current.includes(topCandidate)
        ) {
          // we have a single confident candidate with no competitors — show it!
          setSuggLang(topCandidate)
        } else {
          const nextBestCandidate = uncertain.at(0)?.language
          // ambiguous results — if the top candidate isn't already
          // selected or previously declined, nudge the user
          if (
            nextBestCandidate !== undefined &&
            !currLangs.includes(nextBestCandidate) &&
            !declinedSuggLangsRef.current.includes(nextBestCandidate)
          ) {
            handleOnNudge()
            ax.metric('composer:language:nudgeUser', {
              os: Platform.OS,
              suggestedLanguage: nextBestCandidate,
              currentTargetLanguages: currLangs,
              textLength: text.length,
            })
          }

          setSuggLang(undefined)
        }
      } catch (e) {
        ax.logger.error('Error detecting language', {safeMessage: e})
      }
    }, 500)
  }, [])

  useEffect(() => {
    // show reply prompt if there's not enough text to start using the model
    if (text.length > 0 && !hasInteracted) {
      setHasInteracted(true)
    }

    if (ax.features.enabled(ax.features.ComposerLanguageDetectionEnable)) {
      const textTrimmed = sanitizeTextForDetection(text)

      /*
       * If text drops under the min length requirement, reset suggestions state
       * objects.
       *
       * And we don't run the language model on small posts, the results are
       * likely to be inaccurate.
       */
      if (textTrimmed.length < MIN_TEXT_LENGTH) {
        setSuggLang(undefined)
        return
      }

      void detectLanguage(textTrimmed)
    }

    // Cancel any pending debounced invocation on unmount / re-run so we
    // don't call setSuggLang after the composer has closed (or after the
    // user has already accepted a language).
    return () => {
      detectLanguage.cancel()
    }
  }, [text, hasInteracted, detectLanguage, ax])

  /*
   * This is intentionally computed based on a ref. Since we set and clear
   * `suggLang` this derivation is safe, but be aware of it
   * when making changes.
   */
  const hasDeclined = suggLang
    ? // eslint-disable-next-line react-hooks/refs
      declinedSuggLangsRef.current.includes(suggLang)
    : false

  /*
   * We've detected a language, and the user hasn't already selected it.
   */
  const hasLanguageSuggestion = suggLang && !currentLanguages.includes(suggLang)

  /*
   * We have not detected a different language, and the user is not already
   * using or has not already selected one of the languages of the post they
   * are replying to.
   */
  const replyToLanguages = replyToLanguagesProp
    .filter(Boolean)
    .map(lang => parseLanguageString(lang)?.language)
    .filter(Boolean) as string[]
  const hasSuggestedReplyLanguage =
    !hasInteracted &&
    !suggLang &&
    replyToLanguages.length &&
    !replyToLanguages.some(l => currentLanguages.includes(l))

  if (hasDeclined) {
    return null
  } else if (hasLanguageSuggestion) {
    return (
      <GuessedLanguage
        language={suggLang}
        metadata={{currentTargetLanguages: currentLanguages, rawText: text}}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    )
  } else if (hasSuggestedReplyLanguage) {
    return (
      <ReplyLanguageNudge
        language={replyToLanguages[0]}
        metadata={{currentTargetLanguages: currentLanguages}}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    )
  } else {
    return null
  }
}

function GuessedLanguage({
  language,
  metadata,
  onAccept: onAcceptOuter,
  onDecline: onDeclineOuter,
}: {
  language: string
  metadata: {
    currentTargetLanguages: string[]
    rawText: string
  }
  onAccept: (language: string) => void
  onDecline: () => void
}) {
  const ax = useAnalytics()
  const langPrefs = useLanguagePrefs()
  const suggestedLanguageName = codeToLanguageName(
    language,
    langPrefs.appLanguage,
  )
  const onAccept = () => {
    ax.metric('composer:language:acceptSuggestion', {
      os: Platform.OS,
      suggestedLanguage: language,
      currentTargetLanguages: metadata.currentTargetLanguages,
      textLength: sanitizeTextForDetection(metadata.rawText).length,
    })
    onAcceptOuter(language)
  }
  const onDecline = () => {
    ax.metric('composer:language:declineSuggestion', {
      os: Platform.OS,
      suggestedLanguage: language,
      currentTargetLanguages: metadata.currentTargetLanguages,
      textLength: sanitizeTextForDetection(metadata.rawText).length,
    })
    onDeclineOuter()
  }

  const metaRef = useNonReactiveObject(metadata)
  useEffect(() => {
    ax.metric('composer:language:suggestLanguage', {
      os: Platform.OS,
      suggestedLanguage: language,
      currentTargetLanguages: metaRef.current.currentTargetLanguages,
      textLength: sanitizeTextForDetection(metadata.rawText).length,
    })
  }, [ax, language])

  return (
    <LanguageSuggestionButton
      label={
        <RNText>
          <Trans>
            Are you writing in{' '}
            <Text style={[a.font_semi_bold]}>{suggestedLanguageName}</Text>?
          </Trans>
        </RNText>
      }
      value={language}
      onAccept={onAccept}
      onDecline={onDecline}
    />
  )
}

function ReplyLanguageNudge({
  language,
  metadata,
  onAccept: onAcceptOuter,
  onDecline: onDeclineOuter,
}: {
  language: string
  metadata: {
    currentTargetLanguages: string[]
  }
  onAccept: (language: string) => void
  onDecline: () => void
}) {
  const ax = useAnalytics()
  const langPrefs = useLanguagePrefs()
  const suggestedLanguageName = codeToLanguageName(
    language,
    langPrefs.appLanguage,
  )
  const onAccept = () => {
    ax.metric('composer:language:replyNudgeAccept', {
      replyToLanguage: language,
      currentTargetLanguages: metadata.currentTargetLanguages,
    })
    onAcceptOuter(language)
  }
  const onDecline = () => {
    ax.metric('composer:language:replyNudgeDecline', {
      replyToLanguage: language,
      currentTargetLanguages: metadata.currentTargetLanguages,
    })
    onDeclineOuter()
  }

  return (
    <LanguageSuggestionButton
      label={
        <RNText>
          <Trans>
            The post you’re replying to was marked as being written in{' '}
            {suggestedLanguageName} by its author. Would you like to reply in{' '}
            <Text style={[a.font_semi_bold]}>{suggestedLanguageName}</Text>?
          </Trans>
        </RNText>
      }
      value={language}
      onAccept={onAccept}
      onDecline={onDecline}
    />
  )
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
          shape="round"
          onPress={() => onAccept(value)}
          label={l`Accept this language suggestion`}>
          <ButtonIcon icon={CheckIcon} size="sm" />
        </Button>

        <Button
          size="small"
          color="secondary"
          shape="round"
          onPress={() => onDecline()}
          label={l`Decline this language suggestion`}>
          <ButtonIcon icon={XIcon} size="sm" />
        </Button>
      </View>
    </View>
  )
}

/**
 * Run detection and partition candidates into "certain" (confident enough
 * to suggest on their own) and "uncertain" (above the noise floor but not
 * confident enough to suggest). Callers decide what to do with the shape:
 * a single certain candidate with no uncertain competitors is a strong
 * suggestion; everything else is ambiguous.
 *
 * The acceptance threshold is resolved per candidate with this precedence:
 *   1. Per-language override (e.g. maybe `id` requires higher confidence)
 *   2. Device-locale bar (lower on native — the user likely writes in a
 *      language they have installed)
 *   3. Platform-level bar
 */
async function guessLanguage(
  text: string,
  config: LanguageDetectionConfig,
): Promise<{
  certain: LanguageResult[]
  uncertain: LanguageResult[]
}> {
  const suggestions = await guessLanguageAsync(text)
  const certain: LanguageResult[] = []
  const uncertain: LanguageResult[] = []

  for (const suggestion of suggestions) {
    const isDeviceLocale = deviceLanguageCodes.includes(suggestion.language)
    const override = config.overrides[suggestion.language]
    const threshold = isDeviceLocale
      ? (override?.deviceLocaleAcceptanceThreshold ??
        config.deviceLocaleAcceptanceThreshold)
      : (override?.acceptanceThreshold ?? config.acceptanceThreshold)

    if (suggestion.confidence >= threshold) {
      certain.push(suggestion)
    } else if (suggestion.confidence >= NOISE_FLOOR) {
      uncertain.push(suggestion)
    }
  }

  return {certain, uncertain}
}

/**
 * Strip any detected facets from the text to improve language detection
 * accuracy. For example, URLs and mentions.
 *
 * Tags are intentionally kept — their word content is usually in the
 * post's language and helps detection; the leading `#` is short enough
 * not to distort results.
 */
function sanitizeTextForDetection(text: string): string {
  const rt = new RichText({text: text.trim()})
  rt.detectFacetsWithoutResolution()

  let sanitized = ''
  for (const segment of rt.segments()) {
    if (segment.isLink() || segment.isMention() || segment.isTag()) {
      continue
    }
    sanitized += segment.text
  }

  return sanitized.trim()
}
