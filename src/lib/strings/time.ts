const NOW = 5
const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH = DAY * 28
const YEAR = DAY * 365
export function ago(time: number | string | Date): string {
  const base = new Date()
  const date = time instanceof Date ? time : new Date(time)

  let diffSeconds = Math.floor((base.getTime() - date.getTime()) / 1e3)

  if (diffSeconds < NOW) {
    return `now`
  } else if (diffSeconds < MINUTE) {
    return `${diffSeconds}s`
  } else if (diffSeconds < HOUR) {
    return `${Math.floor(diffSeconds / MINUTE)}m`
  } else if (diffSeconds < DAY) {
    return `${Math.floor(diffSeconds / HOUR)}h`
  } else if (diffSeconds < MONTH) {
    date.setHours(0, 0, 0, 0)
    base.setHours(0, 0, 0, 0)

    const normalizedDiff = Math.floor((base.getTime() - date.getTime()) / 1e3)

    return `${Math.floor(normalizedDiff / DAY)}d`
  } else if (diffSeconds < YEAR) {
    return `${Math.floor(diffSeconds / MONTH)}mo`
  } else {
    return date.toLocaleDateString()
  }
}

export function niceDate(date: number | string | Date) {
  const d = new Date(date)
  return `${d.toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })} at ${d.toLocaleTimeString(undefined, {
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
