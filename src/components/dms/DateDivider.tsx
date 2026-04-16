import {memo} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {subDays} from 'date-fns'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '../Typography'
import {localDateString} from './util'

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: 'numeric',
})
const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
})
const longDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'long',
  day: 'numeric',
})
const longDateFormatterWithYear = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export function useDateTimeString({
  date: dateStr,
  onlyTime = false,
}: {
  date: string
  onlyTime?: boolean
}) {
  const {t: l} = useLingui()

  let date: string
  const time = timeFormatter.format(new Date(dateStr))

  const timestamp = new Date(dateStr)

  const today = new Date()
  const yesterday = subDays(today, 1)
  const oneWeekAgo = subDays(today, 7)

  if (localDateString(today) === localDateString(timestamp)) {
    date = l`Today`
  } else if (localDateString(yesterday) === localDateString(timestamp)) {
    date = l`Yesterday`
  } else {
    if (timestamp < oneWeekAgo) {
      if (timestamp.getFullYear() === today.getFullYear()) {
        date = longDateFormatter.format(timestamp)
      } else {
        date = longDateFormatterWithYear.format(timestamp)
      }
    } else {
      date = weekdayFormatter.format(timestamp)
    }
  }

  if (onlyTime) return time

  return l`${date} at ${time}`
}

let DateDivider = ({date}: {date: string}): React.ReactNode => {
  const t = useTheme()

  const datetime = useDateTimeString({date})

  return (
    <View style={[a.w_full, a.my_sm]}>
      <Text
        style={[
          a.text_xs,
          a.text_center,
          t.atoms.bg,
          t.atoms.text_contrast_medium,
          a.px_md,
        ]}>
        {datetime}
      </Text>
    </View>
  )
}
DateDivider = memo(DateDivider)
export {DateDivider}
