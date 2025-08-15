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
    const textTrimmed = text.trim()

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
