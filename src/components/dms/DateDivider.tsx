import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
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
  const {_} = useLingui()
  const t = useTheme()

  let date: string
  const time = timeFormatter.format(new Date(dateStr))

  const timestamp = new Date(dateStr)

  const today = new Date()
  const yesterday = subDays(today, 1)
  const oneWeekAgo = subDays(today, 7)

  if (localDateString(today) === localDateString(timestamp)) {
    date = _(msg`Today`)
  } else if (localDateString(yesterday) === localDateString(timestamp)) {
    date = _(msg`Yesterday`)
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
    <View style={[a.w_full, a.my_lg]}>
      <Text
        style={[
          a.text_xs,
          a.text_center,
          t.atoms.bg,
          t.atoms.text_contrast_medium,
          a.px_md,
        ]}>
        <Trans>
          <Text
            style={[a.text_xs, t.atoms.text_contrast_medium, a.font_semi_bold]}>
            {date}
          </Text>{' '}
          at {time}
        </Trans>
      </Text>
    </View>
  )
}
DateDivider = React.memo(DateDivider)
export {DateDivider}
