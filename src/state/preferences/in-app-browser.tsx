import {usePref, useSetPref} from './simple-prefs'

/* Backed by the merged simple-prefs provider; see simple-prefs.tsx. */
export function useInAppBrowser() {
  return usePref('useInAppBrowser')
}

export function useSetInAppBrowser() {
  return useSetPref('useInAppBrowser')
}
