import {AtUri} from '@atproto/api'
import type {I18n} from '@lingui/core'

export function niceDate(i18n: I18n, date: number | string | Date) {
  const d = new Date(date)

  return i18n.date(d, {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

export function getRkey({uri}: {uri: string}): string {
  const at = new AtUri(uri)
  return at.rkey
}
