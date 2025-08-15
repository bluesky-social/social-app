import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Trans} from '@lingui/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {deviceLanguageCodes} from '#/locale/deviceLocales'
import {languageName} from '#/locale/helpers'
import {useModalControls} from '#/state/modals'
import {
  useLanguagePrefs,
  useLanguagePrefsApi,
} from '#/state/preferences/languages'
import {atoms as a, tokens} from '#/alf'
import {fontWeight} from '#/alf/tokens'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import {LANGUAGES, LANGUAGES_MAP_CODE2} from '../../../../locale/languages'
import {ScrollView} from '../util'
import {ConfirmLanguagesButton} from './ConfirmLanguagesButton'

export const snapPoints = ['80%']

export function Component() {
  const {closeModal} = useModalControls()
  const langPrefs = useLanguagePrefs()
  const [toggleList, setToggleList] = React.useState<string[]>(
    langPrefs.postLanguage.split(',') || [langPrefs.primaryLanguage],
  )
  const setLangPrefs = useLanguagePrefsApi()
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()

  const onPressDone = React.useCallback(() => {
    let langsString = toggleList.join(',')

    if (!langsString) {
      langsString = langPrefs.primaryLanguage
    }

    setLangPrefs.setPostLanguage(langsString)
    closeModal()
  }, [closeModal, toggleList, langPrefs.primaryLanguage, setLangPrefs])

  const languages = React.useMemo(() => {
    const langs = LANGUAGES.filter(
      lang =>
        !!lang.code2.trim() &&
        LANGUAGES_MAP_CODE2[lang.code2].code3 === lang.code3,
    )
    // sort so that device & selected languages are on top, then alphabetically
    langs.sort((langA, langB) => {
      const hasA =
        toggleList.includes(langA.code2) ||
        deviceLanguageCodes.includes(langA.code2)
      const hasB =
        toggleList.includes(langB.code2) ||
        deviceLanguageCodes.includes(langB.code2)
      if (hasA === hasB) return langA.name.localeCompare(langB.name)
      if (hasA) return -1
      return 1
    })
    return langs
  }, [toggleList])

  return (
    <View
      testID="postLanguagesModal"
      style={[
        pal.view,
        styles.container,
        // @ts-ignore vh is on web only
        isMobile
          ? {
              paddingTop: tokens.space.xl,
            }
          : {
              maxHeight: '90vh',
            },
      ]}>
      <Text style={[pal.text, styles.title]}>
        <Trans>Post Languages</Trans>
      </Text>
      <Text style={[pal.text, styles.description]}>
        <Trans>Which languages are used in this post?</Trans>
      </Text>
      <ScrollView style={styles.scrollContainer}>
        <View style={[a.gap_sm]}>
          <Toggle.Group
            onChange={setToggleList}
            values={toggleList}
            label={'idk'}
            maxSelections={3}>
            {languages.map(lang => {
              return (
                <Toggle.Item
                  key={lang.code2}
                  name={lang.code2}
                  label={languageName(lang, langPrefs.appLanguage)}
                  style={[pal.border, styles.languageToggle]}>
                  <Toggle.LabelText style={[a.flex_1]}>
                    {languageName(lang, langPrefs.appLanguage)}
                  </Toggle.LabelText>
                  <Toggle.Switch />
                </Toggle.Item>
              )
            })}
          </Toggle.Group>
        </View>

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
    paddingHorizontal: tokens.space.md,
  },
  title: {
    textAlign: 'left',
    fontWeight: fontWeight.bold,
    fontSize: tokens.fontSize._2xl,
    marginBottom: tokens.space.sm,
    paddingHorizontal: tokens.space.lg,
  },
  description: {
    textAlign: 'left',
    paddingHorizontal: tokens.space.lg,
    marginBottom: tokens.space.sm,
    paddingBottom: tokens.space.lg,
    fontSize: tokens.fontSize.md,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: tokens.space.lg,
  },
  languageToggle: {
    borderTopWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: tokens.space.md,
  },
  dimmed: {
    opacity: 0.5,
  },
})
