import {memo} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
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

let DateDivider = ({date: dateStr}: {date: string}): React.ReactNode => {
  const t = useTheme()
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

  return (
    <View style={[a.w_full, a.my_sm]}>
      <Text
        style={[
          a.text_xs,
          a.text_center,
          t.atoms.text_contrast_medium,
          a.px_md,
        ]}>
        <Trans>
          {date} at {time}
        </Trans>
      </Text>
    </View>
  )
}
DateDivider = memo(DateDivider)
export {DateDivider}
