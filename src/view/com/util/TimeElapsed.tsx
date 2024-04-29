import React from 'react'

import {useTickEveryMinute} from '#/state/shell'
import {ago} from 'lib/strings/time'

export function TimeElapsed({
  timestamp,
  children,
}: {
  timestamp: string
  children: ({timeElapsed}: {timeElapsed: string}) => JSX.Element
}) {
  const tick = useTickEveryMinute()
  const [timeElapsed, setTimeAgo] = React.useState(() => ago(timestamp))

  const [prevTick, setPrevTick] = React.useState(tick)
  if (prevTick !== tick) {
    setPrevTick(tick)
    setTimeAgo(ago(timestamp))
  }

  return children({timeElapsed})
}
