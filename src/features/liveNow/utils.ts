import {AppBskyActorStatus, AppBskyEmbedExternal} from '@atproto/api'
import {type I18n} from '@lingui/core'
import {plural} from '@lingui/core/macro'
import psl from 'psl'

/**
 * Validates a raw status record and returns the typed record, or null if the
 * value is not a valid `app.bsky.actor.status` record.
 */
export function getValidLiveStatusRecord(
  statusRecord: unknown,
): AppBskyActorStatus.Record | null {
  if (!AppBskyActorStatus.isRecord(statusRecord)) return null
  const validation = AppBskyActorStatus.validateRecord(statusRecord)
  if (!validation.success) return null
  return validation.value
}

/**
 * Extracts the external link URI from a status record, if present. Returns an
 * empty string when the record is invalid or has no external embed.
 */
export function getLiveLinkFromStatusRecord(statusRecord: unknown): string {
  const record = getValidLiveStatusRecord(statusRecord)
  if (!record) return ''
  if (!AppBskyEmbedExternal.isMain(record.embed)) return ''
  return record.embed.external.uri
}

export function displayDuration(i18n: I18n, durationInMinutes: number) {
  const roundedDurationInMinutes = Math.round(durationInMinutes)
  const hours = Math.floor(roundedDurationInMinutes / 60)
  const minutes = roundedDurationInMinutes % 60
  const minutesString = i18n._(
    plural(minutes, {one: '# minute', other: '# minutes'}),
  )
  return hours > 0
    ? i18n._(
        minutes > 0
          ? plural(hours, {
              one: `# hour ${minutesString}`,
              other: `# hours ${minutesString}`,
            })
          : plural(hours, {
              one: '# hour',
              other: '# hours',
            }),
      )
    : minutesString
}

const serviceUrlToNameMap: Record<string, string> = {
  'twitch.tv': 'Twitch',
  'youtube.com': 'YouTube',
  'nba.com': 'NBA',
  'nba.smart.link': 'nba.smart.link',
  'espn.com': 'ESPN',
  'stream.place': 'Streamplace',
  'skylight.social': 'Skylight',
  'bluecast.app': 'Bluecast',
  'substack.com': 'Substack',
  'beehiiv.com': 'Beehiiv',
}

export function getLiveServiceNames(domains: Set<string>) {
  const names = Array.from(
    new Set(
      Array.from(domains.values())
        .map(d => sanitizeLiveNowHost(d))
        .map(d => serviceUrlToNameMap[d] || d),
    ),
  )
  return {
    names,
    formatted: names.join(', '),
  }
}

export function sanitizeLiveNowHost(hostname: string) {
  // special case this one
  if (hostname === 'nba.smart.link') {
    return hostname
  }
  const parsed = psl.parse(hostname)
  if (parsed.error || !parsed.listed || !parsed.domain) {
    // fall back to dumb version
    return hostname.replace(/^www\./, '')
  }
  return parsed.domain
}

/**
 * Extracts the apex domain from a given URL, for use when matching allowed
 * Live Now hosts.
 */
export function getLiveNowHost(url: string) {
  const {hostname} = new URL(url)
  return sanitizeLiveNowHost(hostname)
}
