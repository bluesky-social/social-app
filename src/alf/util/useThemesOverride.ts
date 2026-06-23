import {useMemo} from 'react'

import {useThemePrefs} from '#/state/shell'
import {buildThemes} from '#/alf/themes'
import {type AccentKey, ACCENTS, DEFAULT_ACCENT} from '#/config/brand-theme'

/**
 * Eurosky: resolve the per-user accent preference into a ThemeProvider
 * `themesOverride`. Returns undefined when the active accent is the brand
 * default (already baked into `themes`) or the stored value isn't a known
 * accent - so the default build is used unchanged.
 */
export function useThemesOverride():
  | ReturnType<typeof buildThemes>
  | undefined {
  const {accentColor} = useThemePrefs()
  return useMemo(() => {
    if (
      !accentColor ||
      !(accentColor in ACCENTS) ||
      accentColor === DEFAULT_ACCENT
    ) {
      return undefined
    }
    return buildThemes(accentColor as AccentKey)
  }, [accentColor])
}
