import React from 'react'
import {I18n} from '@lingui/core'
import {useLingui} from '@lingui/react'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useTickEveryMinute} from '#/state/shell'

export function TimeElapsed({
  timestamp,
  children,
  timeToString,
}: {
  timestamp: string
  children: ({timeElapsed}: {timeElapsed: string}) => JSX.Element
  timeToString?: (i18n: I18n, timeElapsed: string) => string
}) {
  const {i18n} = useLingui()
  const ago = useGetTimeAgo()
  const tick = useTickEveryMinute()
  const [timeElapsed, setTimeAgo] = React.useState(() =>
    timeToString ? timeToString(i18n, timestamp) : ago(timestamp, tick),
  )

  const [prevTick, setPrevTick] = React.useState(tick)
  if (prevTick !== tick) {
    setPrevTick(tick)
    setTimeAgo(
      timeToString ? timeToString(i18n, timestamp) : ago(timestamp, tick),
    )
  }

  return children({timeElapsed})
}
