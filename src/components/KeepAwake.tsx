import {useId} from 'react'
import {useKeepAwake} from 'expo-keep-awake'

import {useIsFocused} from '#/lib/navigation'

/**
 * Stops the screen from sleeping. Only applies to the current screen.
 *
 * Note: Expo keeps the screen permanently awake when in dev mode, so
 * you'll only see this do anything when in production.
 *
 * @platform ios, android
 */
export function KeepAwake({enabled = true}) {
  const isFocused = useIsFocused()
  if (enabled && isFocused) {
    return <KeepAwakeInner />
  } else {
    return null
  }
}

function KeepAwakeInner() {
  const id = useId()
  // if you don't pass an explicit ID, any `useKeepAwake` hook unmounting disables them all.
  // very strange behaviour, but easily fixed by passing a unique ID -sfn
  useKeepAwake(id)
  return null
}
