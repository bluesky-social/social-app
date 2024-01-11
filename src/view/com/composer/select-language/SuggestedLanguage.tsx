import React, {useEffect, useState} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import lande from 'lande'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {Text} from '../../util/text/Text'
import {code3ToCode2Strict, codeToLanguageName} from '#/locale/helpers'
import {
  toPostLanguages,
  useLanguagePrefs,
  useLanguagePrefsApi,
} from '#/state/preferences/languages'
import {usePalette} from '#/lib/hooks/usePalette'
import {s} from '#/lib/styles'

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
    if (textTrimmed.length < 10) {
      setSuggestedLanguage(undefined)
      return
    }

    const idle = requestIdleCallback(() => {
      // Only select languages that are
      const result = lande(textTrimmed).filter(
        ([lang, value]) => value >= 0.85 && code3ToCode2Strict(lang),
      )

      setSuggestedLanguage(
        result.length > 0 ? code3ToCode2Strict(result[0][0]) : undefined,
      )
    })

    return () => cancelIdleCallback(idle)
  }, [text])

  return suggestedLanguage &&
    !toPostLanguages(langPrefs.postLanguage).includes(suggestedLanguage) ? (
    <View style={[pal.borderDark, styles.infoBar]}>
      <Text style={[pal.text, s.flex1]}>
        <Trans>
          You seem to be writing in{' '}
          <Text type="sm-bold" style={pal.text}>
            {codeToLanguageName(suggestedLanguage)}
          </Text>
          , but your post language is currently set to{' '}
          <Text type="sm-bold" style={pal.text}>
            {toPostLanguages(langPrefs.postLanguage)
              .map(lang => codeToLanguageName(lang))
              .join(', ')}
          </Text>
        </Trans>
      </Text>

      <TouchableOpacity
        onPress={() => setLangPrefs.setPostLanguage(suggestedLanguage)}
        accessibilityRole="button"
        accessibilityLabel={_(
          msg`Switch to ${codeToLanguageName(suggestedLanguage)}`,
        )}
        accessibilityHint={_(
          msg`Switch to ${codeToLanguageName(suggestedLanguage)}`,
        )}>
        <Text style={pal.link}>
          <Trans>Switch</Trans>
        </Text>
      </TouchableOpacity>
    </View>
  ) : null
}

const styles = StyleSheet.create({
  infoBar: {
    flexDirection: 'row',
    gap: 16,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 10,
    marginBottom: 10,
  },
})
