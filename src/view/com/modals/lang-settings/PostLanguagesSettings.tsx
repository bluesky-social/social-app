import React from 'react'
import {StyleSheet, View} from 'react-native'
import {ScrollView} from '../util'
import {useStores} from 'state/index'
import {Text} from '../../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb, deviceLocales} from 'platform/detection'
import {LANGUAGES, LANGUAGES_MAP_CODE2} from '../../../../locale/languages'
import {LanguageToggle} from './LanguageToggle'
import {ConfirmLanguagesButton} from './ConfirmLanguagesButton'

export const snapPoints = ['100%']

export function Component({}: {}) {
  const store = useStores()
  const pal = usePalette('default')
  const onPressDone = React.useCallback(() => {
    store.shell.closeModal()
  }, [store])

  const languages = React.useMemo(() => {
    const langs = LANGUAGES.filter(
      lang =>
        !!lang.code2.trim() &&
        LANGUAGES_MAP_CODE2[lang.code2].code3 === lang.code3,
    )
    // sort so that device & selected languages are on top, then alphabetically
    langs.sort((a, b) => {
      const hasA =
        store.preferences.hasPostLanguage(a.code2) ||
        deviceLocales.includes(a.code2)
      const hasB =
        store.preferences.hasPostLanguage(b.code2) ||
        deviceLocales.includes(b.code2)
      if (hasA === hasB) return a.name.localeCompare(b.name)
      if (hasA) return -1
      return 1
    })
    return langs
  }, [store])

  const onPress = React.useCallback(
    (code2: string) => {
      store.preferences.togglePostLanguage(code2)
    },
    [store],
  )

  return (
    <View testID="postLanguagesModal" style={[pal.view, styles.container]}>
      <Text style={[pal.text, styles.title]}>Post Languages</Text>
      <Text style={[pal.text, styles.description]}>
        Which languages are used in this post?
      </Text>
      <ScrollView style={styles.scrollContainer}>
        {languages.map(lang => (
          <LanguageToggle
            key={lang.code2}
            code2={lang.code2}
            langType="postLanguages"
            name={lang.name}
            onPress={() => {
              onPress(lang.code2)
            }}
          />
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      <ConfirmLanguagesButton onPress={onPressDone} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
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
  bottomSpacer: {
    height: isDesktopWeb ? 0 : 60,
  },
})
