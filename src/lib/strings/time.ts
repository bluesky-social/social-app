export function ago(date: number | string | Date): string {
  return dateDiff(date, Date.now())
}

const NOW = 5
const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH_30 = DAY * 30
/** Returns the difference between date1 and date2 in full seconds, minutes, hours etc. All month are considered exactly 30 days. Assuming that date1 <= date2. Differences >= 360 days are returned as the "M/D/YYYY" string. */
export function dateDiff(
  date1: number | string | Date,
  date2: number | string | Date,
): string {
  let ts1: number
  if (typeof date1 === 'string') {
    ts1 = Number(new Date(date1))
  } else if (date1 instanceof Date) {
    ts1 = Number(date1)
  } else {
    ts1 = date1
  }
  let ts2: number
  if (typeof date2 === 'string') {
    ts2 = Number(new Date(date2))
  } else if (date2 instanceof Date) {
    ts2 = Number(date2)
  } else {
    ts2 = date2
  }
  const diffSeconds = Math.floor((ts2 - ts1) / 1e3)
  if (diffSeconds < NOW) {
    return `now`
  } else if (diffSeconds < MINUTE) {
    return `${diffSeconds}s`
  } else if (diffSeconds < HOUR) {
    return `${Math.floor(diffSeconds / MINUTE)}m`
  } else if (diffSeconds < DAY) {
    return `${Math.floor(diffSeconds / HOUR)}h`
  } else if (diffSeconds < MONTH_30) {
    return `${Math.floor(diffSeconds / DAY)}d`
  } else {
    const diffMonths30 = Math.floor(diffSeconds / MONTH_30)
    if (diffMonths30 < 12) {
      return `${diffMonths30}mo`
    } else {
      return new Date(ts1).toLocaleDateString()
    }
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
