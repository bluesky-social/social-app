import {AdxUri} from '@adxp/mock-api'

export function pluralize(n: number, base: string, plural?: string): string {
  if (n === 1) {
    return base
  }
  if (plural) {
    return plural
  }
  return base + 's'
}

export function makeRecordUri(
  didOrName: string,
  collection: string,
  recordKey: string,
) {
  const urip = new AdxUri(`adx://host/`)
  urip.host = didOrName
  urip.collection = collection
  urip.recordKey = recordKey
  return urip.toString()
}

const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH = DAY * 30
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
  if (diffSeconds === 0) {
    return 'just now'
  } else if (diffSeconds < MINUTE) {
    return `${diffSeconds}s`
  } else if (diffSeconds < HOUR) {
    return `${Math.floor(diffSeconds / MINUTE)}m`
  } else if (diffSeconds < DAY) {
    return `${Math.floor(diffSeconds / HOUR)}h`
  } else if (diffSeconds < MONTH) {
    return `${Math.floor(diffSeconds / DAY)}d`
  } else if (diffSeconds < YEAR) {
    return `${Math.floor(diffSeconds / MONTH)}mo`
  } else {
    return new Date(ts).toLocaleDateString()
  }
}
