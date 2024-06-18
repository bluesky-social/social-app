import {getLocales} from 'expo-localization'

const LOCALE = getLocales()[0]

export {toSimpleDateString} from '#/lib/strings/time'

export function localizeDate(date: Date | string): string {
  const _date = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(LOCALE.languageTag, {
    timeZone: 'UTC',
  }).format(_date)
}
