import {useState} from 'react'
import {type I18n} from '@lingui/core'
import {useLingui} from '@lingui/react'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useTickEveryMinute} from '#/state/shell'

export function TimeElapsed({
  timestamp,
  children,
  timeToString,
}: {
  timestamp: string
  children: ({timeElapsed}: {timeElapsed: string}) => React.ReactElement
  timeToString?: (i18n: I18n, timeElapsed: string) => string
}) {
  const {i18n} = useLingui()
  const ago = useGetTimeAgo()
  const tick = useTickEveryMinute()
  const [timeElapsed, setTimeAgo] = useState(() =>
    timeToString ? timeToString(i18n, timestamp) : ago(timestamp, tick),
  )

  const [prevTick, setPrevTick] = useState(tick)
  if (prevTick !== tick) {
    setPrevTick(tick)
    setTimeAgo(
      timeToString ? timeToString(i18n, timestamp) : ago(timestamp, tick),
    )
  }

  return children({timeElapsed})
}
