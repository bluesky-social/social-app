import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Trans} from '@lingui/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {deviceLanguageCodes} from '#/locale/deviceLocales'
import {useModalControls} from '#/state/modals'
import {
  useLanguagePrefs,
  useLanguagePrefsApi,
} from '#/state/preferences/languages'
import {LANGUAGES} from '../../../../locale/languages'
import {Text} from '../../util/text/Text'
import {ScrollView} from '../util'
import {ConfirmLanguagesButton} from './ConfirmLanguagesButton'
import {LanguageToggle} from './LanguageToggle'

export const snapPoints = ['100%']

export function Component({}: {}) {
  const {closeModal} = useModalControls()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  const onPressDone = React.useCallback(() => {
    closeModal()
  }, [closeModal])

  const languages = React.useMemo(() => {
    const langs = [...LANGUAGES]
    // sort so that device & selected languages are on top, then alphabetically
    langs.sort((a, b) => {
      const hasA =
        langPrefs.contentLanguages.includes(a.code) ||
        deviceLanguageCodes.includes(a.code)
      const hasB =
        langPrefs.contentLanguages.includes(b.code) ||
        deviceLanguageCodes.includes(b.code)
      if (hasA === hasB) return a.name.localeCompare(b.name)
      if (hasA) return -1
      return 1
    })
    return langs
  }, [langPrefs])

  const onPress = React.useCallback(
    (code: string) => {
      setLangPrefs.toggleContentLanguage(code)
    },
    [setLangPrefs],
  )

  return (
    <View
      testID="contentLanguagesModal"
      style={[
        pal.view,
        styles.container,
        // @ts-ignore vh is web only
        isMobile
          ? {
              paddingTop: 20,
            }
          : {
              maxHeight: '90vh',
            },
      ]}>
      <Text style={[pal.text, styles.title]}>
        <Trans>Content Languages</Trans>
      </Text>
      <Text style={[pal.text, styles.description]}>
        <Trans>
          Which languages would you like to see in your algorithmic feeds?
        </Trans>
      </Text>
      <Text style={[pal.textLight, styles.description]}>
        <Trans>Leave them all unchecked to see any language.</Trans>
      </Text>
      <ScrollView style={styles.scrollContainer}>
        {languages.map(lang => (
          <LanguageToggle
            key={lang.code}
            code={lang.code}
            langType="contentLanguages"
            name={lang.name}
            onPress={() => {
              onPress(lang.code)
            }}
          />
        ))}
        <View
          style={{
            height: isMobile ? 60 : 0,
          }}
        />
      </ScrollView>
      <ConfirmLanguagesButton onPress={onPressDone} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 24,
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
})
