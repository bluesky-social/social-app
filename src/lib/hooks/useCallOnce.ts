import {useCallback} from 'react'

export enum OnceKey {
  PreferencesThread = 'preferences:thread',
}

const called: Record<OnceKey, boolean> = {
  [OnceKey.PreferencesThread]: false,
}

export function useCallOnce(key: OnceKey) {
  return useCallback(
    (cb: () => void) => {
      if (called[key] === true) return
      called[key] = true
      cb()
    },
    [key],
  )
}
