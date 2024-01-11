import React, {useEffect, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import lande from 'lande'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {Text} from '../../util/text/Text'
import {Button} from '../../util/forms/Button'
import {code3ToCode2Strict, codeToLanguageName} from '#/locale/helpers'
import {
  toPostLanguages,
  useLanguagePrefs,
  useLanguagePrefsApi,
} from '#/state/preferences/languages'
import {usePalette} from '#/lib/hooks/usePalette'
import {s} from '#/lib/styles'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

// fallbacks for safari
const onIdle = globalThis.requestIdleCallback || (cb => setTimeout(cb, 1))
const cancelIdle = globalThis.cancelIdleCallback || clearTimeout

export function SuggestedLanguage({text}: {text: string}) {
  const [suggestedLanguage, setSuggestedLanguage] = useState<string>()
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
      // Only select languages that have a high confidence and convert to code2
      const result = lande(textTrimmed).filter(
        ([lang, value]) => value >= 0.97 && code3ToCode2Strict(lang),
      )

      setSuggestedLanguage(
        result.length > 0 ? code3ToCode2Strict(result[0][0]) : undefined,
      )
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
