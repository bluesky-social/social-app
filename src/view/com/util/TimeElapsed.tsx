import React from 'react'

import {useTickEveryMinute} from '#/state/shell'
import {ago} from 'lib/strings/time'

// FIXME(dan): Figure out why the false positives

export function TimeElapsed({
  timestamp,
  children,
}: {
  timestamp: string
  children: ({timeElapsed}: {timeElapsed: string}) => JSX.Element
}) {
  const tick = useTickEveryMinute()
  const [timeElapsed, setTimeAgo] = React.useState(() => ago(timestamp))

  React.useEffect(() => {
    setTimeAgo(ago(timestamp))
  }, [timestamp, setTimeAgo, tick])

  return children({timeElapsed})
}
