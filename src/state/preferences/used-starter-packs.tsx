import {usePref, useSetPref} from './simple-prefs'

/* Backed by the merged simple-prefs provider; see simple-prefs.tsx. */
export function useHasCheckedForStarterPack() {
  return usePref('hasCheckedForStarterPack')
}

export function useSetHasCheckedForStarterPack() {
  return useSetPref('hasCheckedForStarterPack')
}
