import React from 'react'
import {ago} from 'lib/strings/time'

export function TimeElapsed({
  timestamp,
  children,
}: {
  timestamp: string
  children: ({timeElapsed}: {timeElapsed: string}) => JSX.Element
}) {
  const [timeElapsed, setTimeAgo] = React.useState(ago(timestamp))

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(ago(timestamp))
    }, 60_000)

    return () => clearInterval(interval)
  }, [timestamp, setTimeAgo])

  return children({timeElapsed})
}
