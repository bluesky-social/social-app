import {t} from '@lingui/macro'
import * as persisted from '#/state/persisted'
import {sanitizeAppLanguageSetting} from '#/locale/helpers'

const NOW = 5
const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH = DAY * 28
const YEAR = DAY * 365

export function ago(date: number | string | Date): string {
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
    return t`now`
  } else if (diffSeconds < MINUTE) {
    return t`${diffSeconds}s`
  } else if (diffSeconds < HOUR) {
    return t`${Math.floor(diffSeconds / MINUTE)}m`
  } else if (diffSeconds < DAY) {
    return t`${Math.floor(diffSeconds / HOUR)}h`
  } else if (diffSeconds < MONTH) {
    return t`${Math.round(diffSeconds / DAY)}d`
  } else if (diffSeconds < YEAR) {
    return t`${Math.floor(diffSeconds / MONTH)}mo`
  } else {
    return new Date(ts).toLocaleDateString()
  }
}

export function niceDate(date: number | string | Date) {
  const d = new Date(date)
  const appLanguage = persisted.get('languagePrefs').appLanguage
  const sanitizedLanguage = sanitizeAppLanguageSetting(appLanguage)
  return t`${d.toLocaleDateString(sanitizedLanguage, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })} at ${d.toLocaleTimeString(sanitizedLanguage, {
    hour: 'numeric',
    minute: '2-digit',
  })}`
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
