import {usePref, useSetPref} from './simple-prefs'

/* Backed by the merged simple-prefs provider; see simple-prefs.tsx. */
export function useSubtitlesEnabled() {
  return Boolean(usePref('subtitlesEnabled'))
}

export function useSetSubtitlesEnabled() {
  return useSetPref('subtitlesEnabled')
}
