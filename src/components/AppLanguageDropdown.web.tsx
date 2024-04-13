import React from 'react'
import {View} from 'react-native'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {APP_LANGUAGES} from '#/locale/languages'
import {useLanguagePrefs, useLanguagePrefsApi} from '#/state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'

export function AppLanguageDropdown() {
  const t = useTheme()

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
    },
    [sanitizedLang, setLangPrefs],
  )

  return (
    <View
      style={[
        // We don't have hitSlop here to increase the tap region,
        // alternative is negative margins.
        {height: 32, marginVertical: -((32 - 14) / 2)},
        a.flex_row,
        a.gap_sm,
        a.align_center,
        a.flex_shrink,
      ]}>
      <Text aria-hidden={true} style={t.atoms.text_contrast_medium}>
        {APP_LANGUAGES.find(l => l.code2 === sanitizedLang)?.name}
      </Text>
      <ChevronDown fill={t.atoms.text.color} size="xs" style={a.flex_shrink} />

      <select
        value={sanitizedLang}
        onChange={onChangeAppLanguage}
        style={{
          cursor: 'pointer',
          MozAppearance: 'none',
          WebkitAppearance: 'none',
          appearance: 'none',
          position: 'absolute',
          inset: 0,
          width: '100%',
          color: 'transparent',
          background: 'transparent',
          border: 0,
          padding: 0,
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
