import {usePref, useSetPref} from './simple-prefs'

/* Backed by the merged simple-prefs provider; see simple-prefs.tsx. */
export function useLargeAltBadgeEnabled() {
  return usePref('largeAltBadgeEnabled')
}

export function useSetLargeAltBadgeEnabled() {
  return useSetPref('largeAltBadgeEnabled')
}
