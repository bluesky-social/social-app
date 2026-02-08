import {useEffect, useState} from 'react'
import {type I18n} from '@lingui/core'
import {plural} from '@lingui/macro'

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

// Trailing debounce
export function useDebouncedValue<T>(val: T, delayMs: number): T {
  const [prev, setPrev] = useState(val)

  useEffect(() => {
    const timeout = setTimeout(() => setPrev(val), delayMs)
    return () => clearTimeout(timeout)
  }, [val, delayMs])

  return prev
}

const serviceUrlToNameMap: Record<string, string> = {
  'twitch.tv': 'Twitch',
  'www.twitch.tv': 'Twitch',
  'youtube.com': 'YouTube',
  'www.youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'nba.com': 'NBA',
  'www.nba.com': 'NBA',
  'nba.smart.link': 'nba.smart.link',
  'espn.com': 'ESPN',
  'www.espn.com': 'ESPN',
  'stream.place': 'Streamplace',
  'skylight.social': 'Skylight',
  'bluecast.app': 'Bluecast',
  'www.bluecast.app': 'Bluecast',
}

export function getLiveServiceNames(domains: Set<string>) {
  const names = Array.from(
    new Set(Array.from(domains.values()).map(d => serviceUrlToNameMap[d] || d)),
  )
  return {
    names,
    formatted: names.join(', '),
  }
}
