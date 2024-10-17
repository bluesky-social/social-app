import React from 'react'
import {View} from 'react-native'
import RNPickerSelect, {PickerSelectProps} from 'react-native-picker-select'
import {useQueryClient} from '@tanstack/react-query'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {APP_LANGUAGES} from '#/locale/languages'
import {useLanguagePrefs, useLanguagePrefsApi} from '#/state/preferences'
import {resetPostsFeedQueries} from '#/state/queries/post-feed'
import {atoms as a, useTheme, ViewStyleProp} from '#/alf'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'

export function AppLanguageDropdown(_props: ViewStyleProp) {
  const t = useTheme()

  const queryClient = useQueryClient()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()
  const sanitizedLang = sanitizeAppLanguageSetting(langPrefs.appLanguage)

  const onChangeAppLanguage = React.useCallback(
    (value: Parameters<PickerSelectProps['onValueChange']>[0]) => {
      if (!value) return
      if (sanitizedLang !== value) {
        setLangPrefs.setAppLanguage(sanitizeAppLanguageSetting(value))
      }

      // reset feeds to refetch content
      resetPostsFeedQueries(queryClient)
    },
    [sanitizedLang, setLangPrefs, queryClient],
  )

  return (
    <View style={a.relative}>
      <RNPickerSelect
        placeholder={{}}
        value={sanitizedLang}
        onValueChange={onChangeAppLanguage}
        items={APP_LANGUAGES.filter(l => Boolean(l.code2)).map(l => ({
          label: l.name,
          value: l.code2,
          key: l.code2,
        }))}
        useNativeAndroidPickerStyle={false}
        style={{
          inputAndroid: {
            color: t.atoms.text_contrast_medium.color,
            fontSize: 16,
            paddingRight: 12 + 4,
          },
          inputIOS: {
            color: t.atoms.text.color,
            fontSize: 16,
            paddingRight: 12 + 4,
          },
        }}
      />

      <View
        style={[
          a.absolute,
          a.inset_0,
          {left: 'auto'},
          {pointerEvents: 'none'},
          a.align_center,
          a.justify_center,
        ]}>
        <ChevronDown fill={t.atoms.text.color} size="xs" />
      </View>
    </View>
  )
}
