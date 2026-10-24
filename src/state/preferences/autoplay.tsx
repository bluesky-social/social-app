import {usePref, useSetPref} from './simple-prefs'

/* Backed by the merged simple-prefs provider; see simple-prefs.tsx. */
export function useAutoplayDisabled() {
  return Boolean(usePref('disableAutoplay'))
}

export function useSetAutoplayDisabled() {
  return useSetPref('disableAutoplay')
}
