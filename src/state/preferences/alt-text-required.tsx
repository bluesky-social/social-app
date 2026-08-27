import {usePref, useSetPref} from './simple-prefs'

/* Backed by the merged simple-prefs provider; see simple-prefs.tsx. */
export function useRequireAltTextEnabled() {
  return usePref('requireAltTextEnabled')
}

export function useSetRequireAltTextEnabled() {
  return useSetPref('requireAltTextEnabled')
}
