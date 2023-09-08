import React from 'react'
import {observer} from 'mobx-react-lite'
import {ago} from 'lib/strings/time'
import {useStores} from 'state/index'

// FIXME(dan): Figure out why the false positives
/* eslint-disable react/prop-types */

export const TimeElapsed = observer(function TimeElapsed({
  timestamp,
  children,
}: {
  timestamp: string
  children: ({timeElapsed}: {timeElapsed: string}) => JSX.Element
}) {
  const stores = useStores()
  const [timeElapsed, setTimeAgo] = React.useState(ago(timestamp))

  React.useEffect(() => {
    setTimeAgo(ago(timestamp))
  }, [timestamp, setTimeAgo, stores.shell.tickEveryMinute])

  return children({timeElapsed})
})
