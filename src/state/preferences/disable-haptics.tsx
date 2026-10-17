import {usePref, useSetPref} from './simple-prefs'

/* Backed by the merged simple-prefs provider; see simple-prefs.tsx. */
export function useHapticsDisabled() {
  return Boolean(usePref('disableHaptics'))
}

export function useSetHapticsDisabled() {
  return useSetPref('disableHaptics')
}
