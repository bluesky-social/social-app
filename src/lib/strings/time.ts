import {I18n} from '@lingui/core'
import {defineMessage, msg} from '@lingui/macro'

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

  // We can't use `i18n.number` with a `unit` format here because ICU (which
  // provides localization data) doesn't seem to have narrow unit display
  // formatting for locales like Japanese, Spanish, French and Turkish.

  // We'll use `defineMessage` here instead of our usual `msg` as we can pass
  // an object with a `comment` property that better describes what these
  // strings are supposed to be. These comments get stripped out in production.

  // Intermediate variables are created to improve the interpolation keys.

  if (diffSeconds < NOW) {
    return i18n._(msg`now`)
  } else if (diffSeconds < MINUTE) {
    const seconds = diffSeconds

    return i18n._(
      defineMessage({
        message: `${seconds}s`,
        comment: `How many seconds has passed, displayed in a narrow form`,
      }),
    )
  } else if (diffSeconds < HOUR) {
    const minutes = Math.floor(diffSeconds / MINUTE)

    return i18n._(
      defineMessage({
        message: `${minutes}m`,
        comment: `How many minutes has passed, displayed in a narrow form`,
      }),
    )
  } else if (diffSeconds < DAY) {
    const hours = Math.floor(diffSeconds / HOUR)

    return i18n._(
      defineMessage({
        message: `${hours}h`,
        comment: `How many hours has passed, displayed in a narrow form`,
      }),
    )
  } else if (diffSeconds < MONTH_30) {
    const days = Math.round(diffSeconds / DAY)

    return i18n._(
      defineMessage({
        message: `${days}d`,
        comment: `How many days has passed, displayed in a narrow form`,
      }),
    )
  } else {
    let months = diffSeconds / MONTH
    if (months % 1 >= 0.9) {
      months = Math.ceil(months)
    } else {
      months = Math.floor(months)
    }

    if (months < 12) {
      return i18n._(
        defineMessage({
          message: `${months}mo`,
          comment: `How many months has passed, displayed in a narrow form`,
        }),
      )
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
