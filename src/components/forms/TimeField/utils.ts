import {type I18n} from '@lingui/core'
import {plural} from '@lingui/macro'

// we need the date in the form yyyy-MM-dd to pass to the input
export function toDateString(date: Date | string): string {
  const _date = typeof date === 'string' ? new Date(date) : date
  return _date.toISOString()
}

export function displayDuration(i18n: I18n, durationInMinutes: number) {
  const roundedDurationInMinutes = Math.round(durationInMinutes)
  const hours = Math.floor(roundedDurationInMinutes / 60)
  const minutes = roundedDurationInMinutes % 60
  const minutesString = i18n._(plural(minutes, {other: '#m'}))
  return hours > 0
    ? i18n._(plural(hours, {other: `#h ${minutesString}`}))
    : minutesString
}
