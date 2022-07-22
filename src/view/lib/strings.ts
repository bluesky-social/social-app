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
