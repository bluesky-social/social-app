import {AtUri} from '@atproto/api'
import {t} from '@lingui/macro'

import {appLanguage} from './locale/i18n'

export function niceDate(timestamp: number | string | Date) {
  const d = new Date(timestamp)
  const date = d.toLocaleDateString(appLanguage, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const time = d.toLocaleTimeString(appLanguage, {
    hour: 'numeric',
    minute: '2-digit',
  })
  return t`${date} at ${time}`
}

export function getRkey({uri}: {uri: string}): string {
  const at = new AtUri(uri)
  return at.rkey
}

const formatter = new Intl.NumberFormat(appLanguage, {
  notation: 'compact',
  maximumFractionDigits: 1,
  roundingMode: 'trunc',
})

export function prettyNumber(number: number) {
  return formatter.format(number)
}
