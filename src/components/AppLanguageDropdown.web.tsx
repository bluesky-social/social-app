import React from 'react'
import {View} from 'react-native'
import {useQueryClient} from '@tanstack/react-query'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {APP_LANGUAGES} from '#/locale/languages'
import {useLanguagePrefs, useLanguagePrefsApi} from '#/state/preferences'
import {resetPostsFeedQueries} from '#/state/queries/post-feed'
import {atoms as a, useTheme, ViewStyleProp} from '#/alf'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'

export function AppLanguageDropdown({style}: ViewStyleProp) {
  const t = useTheme()

  const queryClient = useQueryClient()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()

  const sanitizedLang = sanitizeAppLanguageSetting(langPrefs.appLanguage)

  const onChangeAppLanguage = React.useCallback(
    (ev: React.ChangeEvent<HTMLSelectElement>) => {
      const value = ev.target.value

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
    <View
      style={[
        // We don't have hitSlop here to increase the tap region,
        // alternative is negative margins.
        {height: 32, marginVertical: -((32 - 14) / 2)},
        style,
      ]}>
      <View
        style={[
          a.flex_row,
          a.gap_sm,
          a.align_center,
          a.flex_shrink,
          a.h_full,
          t.atoms.bg,
        ]}>
        <Text aria-hidden={true} style={t.atoms.text_contrast_medium}>
          {APP_LANGUAGES.find(l => l.code2 === sanitizedLang)?.name}
        </Text>
        <ChevronDown fill={t.atoms.text.color} size="xs" style={a.flex_0} />
      </View>

      <select
        value={sanitizedLang}
        onChange={onChangeAppLanguage}
        style={{
          fontSize: a.text_sm.fontSize,
          letterSpacing: a.text_sm.letterSpacing,
          cursor: 'pointer',
          position: 'absolute',
          inset: 0,
          opacity: 0,
          color: t.atoms.text.color,
          background: t.atoms.bg.backgroundColor,
          padding: 4,
          maxWidth: '100%',
        }}>
        {APP_LANGUAGES.filter(l => Boolean(l.code2)).map(l => (
          <option key={l.code2} value={l.code2}>
            {l.name}
          </option>
        ))}
      </select>
    </View>
  )
}
