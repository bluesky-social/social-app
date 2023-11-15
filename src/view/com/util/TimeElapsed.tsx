import React from 'react'
import {ago} from 'lib/strings/time'
import {useTickEveryMinute} from '#/state/shell'

// FIXME(dan): Figure out why the false positives
/* eslint-disable react/prop-types */

export function TimeElapsed({
  timestamp,
  children,
}: {
  timestamp: string
  children: ({timeElapsed}: {timeElapsed: string}) => JSX.Element
}) {
  const tick = useTickEveryMinute()
  const [timeElapsed, setTimeAgo] = React.useState(ago(timestamp))

  React.useEffect(() => {
    setTimeAgo(ago(timestamp))
  }, [timestamp, setTimeAgo, tick])

  return children({timeElapsed})
}
