import {t} from '@lingui/macro'

export function niceDate(date: number | string | Date, appLang: string) {
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
