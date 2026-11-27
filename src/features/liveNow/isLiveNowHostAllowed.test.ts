import {
  isLiveNowHostAllowed,
  sanitizeLiveNowHost,
} from '#/features/liveNow/utils'

describe('isLiveNowHostAllowed', () => {
  const hosts = new Set([
    'twitch.tv',
    'youtube.com',
    'bbc.co.uk',
    'nba.smart.link',
  ])

  it('matches allowed hosts and their subdomains', () => {
    expect(isLiveNowHostAllowed('twitch.tv', hosts)).toBe(true)
    expect(isLiveNowHostAllowed('www.twitch.tv', hosts)).toBe(true)
    expect(isLiveNowHostAllowed('m.youtube.com', hosts)).toBe(true)
    expect(isLiveNowHostAllowed('www.bbc.co.uk', hosts)).toBe(true)
    expect(isLiveNowHostAllowed('nba.smart.link', hosts)).toBe(true)
  })

  it('does not match other hosts', () => {
    expect(isLiveNowHostAllowed('nottwitch.tv', hosts)).toBe(false)
    expect(isLiveNowHostAllowed('twitch.tv.example.com', hosts)).toBe(false)
    expect(isLiveNowHostAllowed('co.uk', hosts)).toBe(false)
    expect(isLiveNowHostAllowed('other.smart.link', hosts)).toBe(false)
    expect(isLiveNowHostAllowed('localhost', hosts)).toBe(false)
  })

  it('agrees with matching the sanitized apex domain', () => {
    for (const hostname of [
      'twitch.tv',
      'www.twitch.tv',
      'clips.twitch.tv',
      'youtube.com',
      'music.youtube.com',
      'bbc.co.uk',
      'www.bbc.co.uk',
      'nba.smart.link',
      'example.com',
      'www.example.unknowntld',
      'co.uk',
    ]) {
      expect(isLiveNowHostAllowed(hostname, hosts)).toBe(
        hosts.has(sanitizeLiveNowHost(hostname)),
      )
    }
  })
})
