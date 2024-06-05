import {useEffect, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import lande from 'lande'

import {usePalette} from '#/lib/hooks/usePalette'
import {s} from '#/lib/styles'
import {code3ToCode2Strict, codeToLanguageName} from '#/locale/helpers'
import {
  toPostLanguages,
  useLanguagePrefs,
  useLanguagePrefsApi,
} from '#/state/preferences/languages'
import {Button} from '../../util/forms/Button'
import {Text} from '../../util/text/Text'

// fallbacks for safari
const onIdle = globalThis.requestIdleCallback || (cb => setTimeout(cb, 1))
const cancelIdle = globalThis.cancelIdleCallback || clearTimeout

export function SuggestedLanguage({text}: {text: string}) {
  const [suggestedLanguage, setSuggestedLanguage] = useState<
    string | undefined
  >()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()
  const pal = usePalette('default')
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

  return suggestedLanguage &&
    !toPostLanguages(langPrefs.postLanguage).includes(suggestedLanguage) ? (
    <View style={[pal.border, styles.infoBar]}>
      <FontAwesomeIcon
        icon="language"
        style={pal.text as FontAwesomeIconStyle}
        size={24}
      />
      <Text style={[pal.text, s.flex1]}>
        <Trans>
          Are you writing in{' '}
          <Text type="sm-bold" style={pal.text}>
            {codeToLanguageName(suggestedLanguage)}
          </Text>
          ?
        </Trans>
      </Text>

      <Button
        type="default"
        onPress={() => setLangPrefs.setPostLanguage(suggestedLanguage)}
        accessibilityLabel={_(
          msg`Change post language to ${codeToLanguageName(suggestedLanguage)}`,
        )}
        accessibilityHint="">
        <Text type="button" style={[pal.link, s.fw600]}>
          <Trans>Yes</Trans>
        </Text>
      </Button>
    </View>
  ) : null
}

const styles = StyleSheet.create({
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 10,
    marginBottom: 10,
  },
})

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
