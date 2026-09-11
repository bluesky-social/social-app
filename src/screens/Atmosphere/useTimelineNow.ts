import {useEffect, useState} from 'react'
import {AppState} from 'react-native'

import {useTickEveryMinute} from '#/state/shell'

/** Refresh calendar boundaries on the shared minute tick and after resuming. */
export function useTimelineNow() {
  const tick = useTickEveryMinute()
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    setNow(Date.now())
  }, [tick])
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') setNow(Date.now())
    })
    return () => subscription.remove()
  }, [])
  return new Date(now)
}
