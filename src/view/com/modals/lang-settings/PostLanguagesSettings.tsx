import React from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {deviceLanguageCodes} from '#/locale/deviceLocales'
import {languageName} from '#/locale/helpers'
import {useModalControls} from '#/state/modals'
import {
  useLanguagePrefs,
  useLanguagePrefsApi,
} from '#/state/preferences/languages'
import {atoms as a, useTheme} from '#/alf'
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
  const t = useTheme()
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
        t.atoms.bg,
        a.flex_1,
        a.px_md,
        isMobile ? [a.pt_xl] : [a.pt_lg, {maxHeight: '90%'}],
      ]}>
      <Text
        style={[
          t.atoms.text,
          a.text_left,
          a.font_bold,
          a.text_2xl,
          a.mb_sm,
          a.px_lg,
        ]}>
        <Trans>Post Languages</Trans>
      </Text>

      <Text
        style={[
          t.atoms.text,
          a.text_left,
          a.px_lg,
          a.mb_sm,
          a.pb_lg,
          a.text_md,
        ]}>
        <Trans>Which languages are used in this post?</Trans>
      </Text>

      <ScrollView style={[a.flex_1, a.px_lg, a.gap_sm]}>
        <Toggle.Group
          onChange={setToggleList}
          values={toggleList}
          label={'languageSelection'}
          maxSelections={3}>
          {languages.map(lang => {
            return (
              <Toggle.Item
                key={lang.code2}
                name={lang.code2}
                label={languageName(lang, langPrefs.appLanguage)}
                style={[
                  t.atoms.border_contrast_low,
                  a.border_t,
                  a.rounded_0,
                  a.px_0,
                  a.py_md,
                ]}>
                <Toggle.LabelText style={[a.flex_1]}>
                  {languageName(lang, langPrefs.appLanguage)}
                </Toggle.LabelText>
                <Toggle.Switch />
              </Toggle.Item>
            )
          })}
        </Toggle.Group>

        {/* Spacer */}
        <View style={[{height: isMobile ? 60 : 0}]} />
      </ScrollView>

      <ConfirmLanguagesButton onPress={onPressDone} />
    </View>
  )
}
