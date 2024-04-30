import React from 'react'

import {useTickEveryMinute} from '#/state/shell'
import {ago} from 'lib/strings/time'

export function TimeElapsed({
  timestamp,
  children,
  timeToString = ago,
}: {
  timestamp: string
  children: ({timeElapsed}: {timeElapsed: string}) => JSX.Element
  timeToString?: (timeElapsed: string) => string
}) {
  const tick = useTickEveryMinute()
  const [timeElapsed, setTimeAgo] = React.useState(() =>
    timeToString(timestamp),
  )

  const [prevTick, setPrevTick] = React.useState(tick)
  if (prevTick !== tick) {
    setPrevTick(tick)
    setTimeAgo(timeToString(timestamp))
  }

  return children({timeElapsed})
}
