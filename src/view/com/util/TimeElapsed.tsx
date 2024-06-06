import {useState} from 'react'

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
  const [timeElapsed, setTimeAgo] = useState(() => timeToString(timestamp))

  const [prevTick, setPrevTick] = useState(tick)
  if (prevTick !== tick) {
    setPrevTick(tick)
    setTimeAgo(timeToString(timestamp))
  }

  return children({timeElapsed})
}
