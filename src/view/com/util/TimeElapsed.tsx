import React from 'react'
import {I18n} from '@lingui/core'
import {useLingui} from '@lingui/react'

import {useTickEveryMinute} from '#/state/shell'
import {ago} from 'lib/strings/time'

export function TimeElapsed({
  timestamp,
  children,
  timeToString = ago,
}: {
  timestamp: string
  children: ({timeElapsed}: {timeElapsed: string}) => JSX.Element
  timeToString?: (i18n: I18n, timeElapsed: string) => string
}) {
  const {i18n} = useLingui()

  const tick = useTickEveryMinute()
  const [timeElapsed, setTimeAgo] = React.useState(() =>
    timeToString(i18n, timestamp),
  )

  const [prevTick, setPrevTick] = React.useState(tick)
  if (prevTick !== tick) {
    setPrevTick(tick)
    setTimeAgo(timeToString(i18n, timestamp))
  }

  return children({timeElapsed})
}
