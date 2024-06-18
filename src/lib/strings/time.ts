import {t} from '@lingui/macro'

const NOW = 5
const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH_30 = DAY * 30
const MONTH = DAY * 30.41675 // This results in 365.001 days in a year, which is close enough for nearly all cases

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
    return `${t`now`}`
  } else if (diffSeconds < MINUTE) {
    return `${diffSeconds}${t`s`}`
  } else if (diffSeconds < HOUR) {
    return `${Math.floor(diffSeconds / MINUTE)}${t`m`}`
  } else if (diffSeconds < DAY) {
    return `${Math.floor(diffSeconds / HOUR)}${t`h`}`
  } else if (diffSeconds < MONTH_30) {
    return `${Math.round(diffSeconds / DAY)}${t`d`}`
  } else {
    let months = diffSeconds / MONTH
    if (months % 1 >= 0.9) {
      months = Math.ceil(months)
    } else {
      months = Math.floor(months)
    }

    if (months < 12) {
      return `${months}${t`mo`}`
    } else {
      return new Date(ts).toLocaleDateString()
    }
  }
}

export function niceDate(date: number | string | Date, appLang?: string) {
  const d = new Date(date)
  return `${d.toLocaleTimeString(appLang || undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })} · ${d.toLocaleDateString(appLang || undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })}`
}

export function getAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}
