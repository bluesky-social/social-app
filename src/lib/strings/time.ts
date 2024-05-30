import {I18n} from '@lingui/core'
import {msg} from '@lingui/macro'

import {MONTH_FALLBACK_LOCALES} from '#/locale/constants'

const NOW = 5
const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH_30 = DAY * 30
const MONTH = DAY * 30.41675 // This results in 365.001 days in a year, which is close enough for nearly all cases
export function ago(i18n: I18n, date: number | string | Date): string {
  let ts: number
  if (typeof date === 'string') {
    ts = Number(new Date(date))
  } else if (date instanceof Date) {
    ts = Number(date)
  } else {
    ts = date
  }
  const diffSeconds = Math.floor((Date.now() - ts) / 1e3)
  if (diffSeconds < NOW) {
    return i18n._(msg`now`)
  } else if (diffSeconds < MINUTE) {
    return i18n.number(diffSeconds, {
      style: 'unit',
      unitDisplay: 'narrow',
      unit: 'second',
    })
  } else if (diffSeconds < HOUR) {
    return i18n.number(Math.floor(diffSeconds / MINUTE), {
      style: 'unit',
      unitDisplay: 'narrow',
      unit: 'minute',
    })
  } else if (diffSeconds < DAY) {
    return i18n.number(Math.floor(diffSeconds / HOUR), {
      style: 'unit',
      unitDisplay: 'narrow',
      unit: 'hour',
    })
  } else if (diffSeconds < MONTH_30) {
    return i18n.number(Math.round(diffSeconds / DAY), {
      style: 'unit',
      unitDisplay: 'narrow',
      unit: 'day',
    })
  } else {
    let months = diffSeconds / MONTH
    if (months % 1 >= 0.9) {
      months = Math.ceil(months)
    } else {
      months = Math.floor(months)
    }

    if (months < 12) {
      if (MONTH_FALLBACK_LOCALES.includes(i18n.locale)) return `${months}mo`

      return i18n.number(months, {
        style: 'unit',
        unitDisplay: 'narrow',
        unit: 'month',
      })
    } else {
      return i18n.date(new Date(ts))
    }
  }
}

export function niceDate(i18n: I18n, date: number | string | Date) {
  const d = new Date(date)

  return i18n.date(d, {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

export function getAge(birthDate: Date): number {
  var today = new Date()
  var age = today.getFullYear() - birthDate.getFullYear()
  var m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}
