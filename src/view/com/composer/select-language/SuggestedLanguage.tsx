import {useEffect, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import lande from 'lande'

import {code3ToCode2Strict, codeToLanguageName} from '#/locale/helpers'
import {
  toPostLanguages,
  useLanguagePrefs,
  useLanguagePrefsApi,
} from '#/state/preferences/languages'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Earth_Stroke2_Corner2_Rounded as EarthIcon} from '#/components/icons/Globe'
import {Text} from '#/components/Typography'

// fallbacks for safari
const onIdle = globalThis.requestIdleCallback || (cb => setTimeout(cb, 1))
const cancelIdle = globalThis.cancelIdleCallback || clearTimeout

export function SuggestedLanguage({text}: {text: string}) {
  const [suggestedLanguage, setSuggestedLanguage] = useState<
    string | undefined
  >()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()
  const t = useTheme()
  const {_} = useLingui()

  useEffect(() => {
    let textTrimmed = text.trim()

    // Remove the last word before guessing to prevent a half-written word
    // or typos from affecting the confidence of language detection.
    // There are two gotchas with this approach:
    // First, it might increase the practical minimum length for the language
    // detection because removing the last word would eat away from the
    // 40 character min limit. I think it's worth it though.
    // Second, this will also discard the last word that has been typed fully
    // which might affect the outcome towards a positive result. One might
    // consider detecting punctuation at the end of the last word to include
    // it in the language detection, but it's quite hard to do that for all
    // languages correctly.
    const lastSpace = textTrimmed.lastIndexOf(' ')
    if (lastSpace > 0) {
      textTrimmed = textTrimmed.slice(0, lastSpace).trim()
    }

    // Don't run the language model on small posts, the results are likely
    // to be inaccurate anyway.
    if (textTrimmed.length < 40) {
      setSuggestedLanguage(undefined)
      return
    }

    const idle = onIdle(() => {
      setSuggestedLanguage(guessLanguage(textTrimmed))
    })

    return () => cancelIdle(idle)
  }, [text])

  if (
    suggestedLanguage &&
    !toPostLanguages(langPrefs.postLanguage).includes(suggestedLanguage)
  ) {
    const suggestedLanguageName = codeToLanguageName(
      suggestedLanguage,
      langPrefs.appLanguage,
    )

    return (
      <View
        style={[
          t.atoms.border_contrast_low,
          a.gap_sm,
          a.border,
          a.flex_row,
          a.align_center,
          a.rounded_sm,
          a.px_lg,
          a.py_md,
          a.mx_md,
          a.my_sm,
          t.atoms.bg,
        ]}>
        <EarthIcon />
        <Text style={[a.flex_1]}>
          <Trans>
            Are you writing in{' '}
            <Text style={[a.font_bold]}>{suggestedLanguageName}</Text>?
          </Trans>
        </Text>

        <Button
          color="secondary"
          size="small"
          variant="solid"
          onPress={() => setLangPrefs.setPostLanguage(suggestedLanguage)}
          label={_(msg`Change post language to ${suggestedLanguageName}`)}>
          <ButtonText>
            <Trans>Yes</Trans>
          </ButtonText>
        </Button>
      </View>
    )
  } else {
    return null
  }
}

/**
 * This function is using the lande language model to attempt to detect the language
 * We want to only make suggestions when we feel a high degree of certainty
 * The magic numbers are based on debugging sessions against some test strings
 */
function guessLanguage(text: string): string | undefined {
  // William Wordsworth's "Composed upon Westminster Bridge, September 3, 1802" poem's
  // last sestet gets a 0.93 confidence score by this model. I find that 90% is a good threshold
  // if we only have only one language detected at that level. I understand that a carefully
  // picked portion of an English sonnet from 223 years ago isn't a perfect
  // representative of modern English, but it's English regardless.
  const scores = lande(text).filter(([_lang, value]) => value >= 0.9)

  // If there are more than one language with a high score, we don't want to make a suggestion
  if (scores.length !== 1) {
    return undefined
  }
  const [lang, _] = scores[0]
  return code3ToCode2Strict(lang)
}
