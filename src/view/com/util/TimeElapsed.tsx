import React from 'react'
import {ago} from 'lib/strings/time'

export function TimeElapsed({
  timestamp,
  children,
}: {
  timestamp: string
  children: ({elapsedTime}: {elapsedTime: string}) => JSX.Element
}) {
  const [elapsedTime, setTimeAgo] = React.useState(ago(timestamp))

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(ago(timestamp))
    }, 60_000)

    return () => clearInterval(interval)
  }, [timestamp, setTimeAgo])

  return children({elapsedTime})
}
