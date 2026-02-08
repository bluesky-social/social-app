import {type I18n} from '@lingui/core'
import {msg} from '@lingui/macro'

export function niceDate(
  i18n: I18n,
  date: number | string | Date,
  dateStyle: 'short' | 'medium' | 'long' | 'full' | 'dot separated' = 'long',
) {
  const d = new Date(date)

  if (dateStyle === 'dot separated') {
    return i18n._(
      msg({
        context: 'date and time formatted like this: [time] · [date]',
        message: `${i18n.date(d, {timeStyle: 'short'})} · ${i18n.date(d, {dateStyle: 'medium'})}`,
      }),
    )
  }

  return i18n.date(d, {
    dateStyle,
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

/**
 * Get a Date object that is N years ago from now
 * @param years number of years
 * @returns Date object
 */
export function getDateAgo(years: number): Date {
  const date = new Date()
  date.setFullYear(date.getFullYear() - years)
  return date
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
