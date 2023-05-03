import React from 'react'
import {StyleSheet, Pressable, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {observer} from 'mobx-react-lite'
import {ScrollView} from './util'
import {useStores} from 'state/index'
import {ToggleButton} from '../util/forms/ToggleButton'
import {s, colors, gradients} from 'lib/styles'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb} from 'platform/detection'
import {LANGUAGES, LANGUAGES_MAP_CODE2} from '../../../locale/languages'

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
    // sort so that selected languages are on top, then alphabetically
    langs.sort((a, b) => {
      const hasA = store.preferences.hasContentLanguage(a.code2)
      const hasB = store.preferences.hasContentLanguage(b.code2)
      if (hasA === hasB) return a.name.localeCompare(b.name)
      if (hasA) return -1
      return 1
    })
    return langs
  }, [store])

  return (
    <View testID="contentLanguagesModal" style={[pal.view, styles.container]}>
      <Text style={[pal.text, styles.title]}>Content Languages</Text>
      <Text style={[pal.text, styles.description]}>
        Which languages would you like to see in the What's Hot feed? (Leave
        them all unchecked to see any language.)
      </Text>
      <ScrollView style={styles.scrollContainer}>
        {languages.map(lang => (
          <LanguageToggle
            key={lang.code2}
            code2={lang.code2}
            name={lang.name}
          />
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      <View style={[styles.btnContainer, pal.borderDark]}>
        <Pressable
          testID="sendReportBtn"
          onPress={onPressDone}
          accessibilityRole="button"
          accessibilityLabel="Confirm content language settings"
          accessibilityHint="">
          <LinearGradient
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.btn]}>
            <Text style={[s.white, s.bold, s.f18]}>Done</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  )
}

const LanguageToggle = observer(
  ({code2, name}: {code2: string; name: string}) => {
    const store = useStores()
    const pal = usePalette('default')

    const onPress = React.useCallback(() => {
      store.preferences.toggleContentLanguage(code2)
    }, [store, code2])

    return (
      <ToggleButton
        label={name}
        isSelected={store.preferences.contentLanguages.includes(code2)}
        onPress={onPress}
        style={[pal.border, styles.languageToggle]}
      />
    )
  },
)

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
  btnContainer: {
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: isDesktopWeb ? 0 : 40,
    borderTopWidth: isDesktopWeb ? 0 : 1,
  },

  languageToggle: {
    borderTopWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 12,
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.gray1,
  },
})
