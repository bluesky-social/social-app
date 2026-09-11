import {getCalendars} from 'expo-localization'
import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'

export function formatDateTime(
  i18n: I18n,
  date: number | string | Date,
  options: Intl.DateTimeFormatOptions,
) {
  const uses24hourClock = getCalendars()[0].uses24hourClock

  return i18n.date(date, {
    ...options,
    ...(uses24hourClock === null ? {} : {hour12: !uses24hourClock}),
  })
}

export function niceDate(
  i18n: I18n,
  date: number | string | Date,
  dateStyle: 'short' | 'medium' | 'long' | 'full' | 'dot separated' = 'long',
  timeStyle: 'short' | 'medium' | 'long' | 'full' | 'none' = 'short',
) {
  const ts = timeStyle === 'none' ? undefined : timeStyle
  const d = new Date(date)

  if (dateStyle === 'dot separated') {
    return i18n._(
      msg({
        context: 'date and time formatted like this: [time] · [date]',
        message: `${formatDateTime(i18n, d, {timeStyle: ts})} · ${i18n.date(d, {dateStyle: 'medium'})}`,
      }),
    )
  }

  return ts
    ? formatDateTime(i18n, d, {dateStyle, timeStyle: ts})
    : i18n.date(d, {dateStyle})
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
