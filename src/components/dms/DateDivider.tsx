import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '../Typography'
import {localDateString} from './util'

let DateDivider = ({date: dateStr}: {date: string}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()

  let display: string

  const date = new Date(dateStr)

  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (localDateString(today) === localDateString(date)) {
    display = _(msg`Today`)
  } else if (localDateString(yesterday) === localDateString(date)) {
    display = _(msg`Yesterday`)
  } else {
    display = new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  return (
    <View style={[a.w_full, a.relative, a.my_lg, a.flex_row, a.justify_center]}>
      <View
        style={[
          a.border_b,
          t.atoms.border_contrast_low,
          a.mx_lg,
          a.absolute,
          {top: '50%', left: 0, right: 0},
        ]}
      />
      <Text style={[a.text_center, t.atoms.bg, a.px_md]}>{display}</Text>
    </View>
  )
}
DateDivider = React.memo(DateDivider)
export {DateDivider}
