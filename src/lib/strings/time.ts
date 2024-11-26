import {DateTimeFormat} from '@formatjs/intl-datetimeformat'
import {I18n} from '@lingui/core'

import {isNative,isWeb} from '#/platform/detection'

export function niceDate(i18n: I18n, date: number | string | Date) {
  const d = new Date(date)

  if (isWeb) {
    return i18n.date(d, {
      dateStyle: 'long',
      timeStyle: 'short',
    })
  }

  if (isNative) {
    const dateFormatter = new DateTimeFormat(i18n.locale, {
      dateStyle: 'long',
      timeStyle: 'short',
    })
    return dateFormatter.format(d)
  }
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

/**
 * Compares two dates by year, month, and day only
 */
export function simpleAreDatesEqual(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
