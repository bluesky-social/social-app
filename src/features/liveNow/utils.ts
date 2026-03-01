import {type I18n} from '@lingui/core'
import {plural} from '@lingui/core/macro'
import psl from 'psl'

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
