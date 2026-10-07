import {describe, expect, it} from '@jest/globals'

import {
  getLinkHost,
  getSupportProvider,
  isBlockedProfileLink,
  isShortenerLink,
  normalizeProfileLinkUrl,
  validateLinkInput,
} from './providers'

describe('getSupportProvider', () => {
  it('matches a provider domain and its subdomains', () => {
    expect(getSupportProvider('https://ko-fi.com/kat')?.name).toBe('Ko-fi')
    expect(getSupportProvider('https://www.patreon.com/kat')?.name).toBe(
      'Patreon',
    )
  })

  it('does not match lookalike domains', () => {
    expect(getSupportProvider('https://ko-fi.com.example.net/kat')).toBe(
      undefined,
    )
    expect(getSupportProvider('https://notpatreon.com/kat')).toBe(undefined)
  })

  it('requires the path prefix for shared domains', () => {
    expect(getSupportProvider('https://paypal.com/paypalme/kat')?.name).toBe(
      'PayPal',
    )
    expect(getSupportProvider('https://paypal.com/signin')).toBe(undefined)
  })

  it('never treats a bare provider homepage as a support link', () => {
    expect(getSupportProvider('https://ko-fi.com')).toBe(undefined)
    expect(getSupportProvider('https://www.patreon.com/')).toBe(undefined)
    expect(getSupportProvider('https://paypal.com/paypalme/')).toBe(undefined)
  })

  it('only counts campaign and gallery pages for path-based providers', () => {
    expect(
      getSupportProvider('https://chuffed.org/project/save-the-reef')?.name,
    ).toBe('Chuffed')
    expect(getSupportProvider('https://chuffed.org/campaign/kat')?.name).toBe(
      'Chuffed',
    )
    expect(getSupportProvider('https://chuffed.org/about')).toBe(undefined)
    expect(
      getSupportProvider('https://www.inprnt.com/gallery/kat/')?.name,
    ).toBe('INPRNT')
    expect(getSupportProvider('https://www.inprnt.com/browse/')).toBe(undefined)
    expect(getSupportProvider('https://throne.com/kat')?.name).toBe('Throne')
  })

  it('recognizes Substack publications and profiles', () => {
    expect(getSupportProvider('https://kat.substack.com')?.name).toBe(
      'Substack',
    )
    expect(getSupportProvider('https://substack.com/@kat')?.name).toBe(
      'Substack',
    )
    expect(getSupportProvider('https://substack.com')).toBe(undefined)
  })

  it('recognizes accounts on a subdomain', () => {
    expect(getSupportProvider('https://kat.itch.io')?.name).toBe('itch.io')
    expect(getSupportProvider('https://kat.gumroad.com/')?.name).toBe('Gumroad')
  })

  it('matches specific provider hosts', () => {
    expect(getSupportProvider('https://buy.stripe.com/abc123')?.name).toBe(
      'Stripe',
    )
    expect(getSupportProvider('https://stripe.com/pricing')).toBe(undefined)
  })

  it('ignores non-web and invalid URLs', () => {
    expect(getSupportProvider('mailto:kat@ko-fi.com')).toBe(undefined)
    expect(getSupportProvider('not a url')).toBe(undefined)
  })
})

describe('normalizeProfileLinkUrl', () => {
  it('adds https to bare domains', () => {
    expect(normalizeProfileLinkUrl(' patreon.com/kat ')).toBe(
      'https://patreon.com/kat',
    )
  })

  it('rejects input that is not a web link', () => {
    expect(normalizeProfileLinkUrl('hello')).toBe(null)
    expect(normalizeProfileLinkUrl('')).toBe(null)
  })
})

describe('getLinkHost', () => {
  it('strips www', () => {
    expect(getLinkHost('https://www.spitfirenews.com/p/1')).toBe(
      'spitfirenews.com',
    )
  })
})

describe('isBlockedProfileLink', () => {
  it('blocks listed domains and their subdomains', () => {
    expect(isBlockedProfileLink('https://onlyfans.com/kat')).toBe(true)
    expect(isBlockedProfileLink('https://www.fansly.com/kat')).toBe(true)
  })

  it('does not block lookalikes or other sites', () => {
    expect(isBlockedProfileLink('https://notonlyfans.com/kat')).toBe(false)
    expect(isBlockedProfileLink('https://ko-fi.com/kat')).toBe(false)
  })
})

describe('isShortenerLink', () => {
  it('flags general-purpose shorteners and their subdomains', () => {
    expect(isShortenerLink('https://bit.ly/abc')).toBe(true)
    expect(isShortenerLink('https://www.tinyurl.com/abc')).toBe(true)
    expect(isShortenerLink('https://x.gd/abc')).toBe(true)
  })

  it('allows brand short links and lookalikes', () => {
    expect(isShortenerLink('https://youtu.be/abc')).toBe(false)
    expect(isShortenerLink('https://amzn.to/abc')).toBe(false)
    expect(isShortenerLink('https://notbit.ly/abc')).toBe(false)
  })
})

describe('validateLinkInput', () => {
  it('normalizes a typed link and recognizes support providers', () => {
    const result = validateLinkInput(' ko-fi.com/kat ')
    expect(result.url).toBe('https://ko-fi.com/kat')
    expect(result.provider?.name).toBe('Ko-fi')
    expect(result.isEmpty).toBe(false)
    expect(result.isBlocked).toBe(false)
  })

  it('flags blocked sites and empty input', () => {
    expect(validateLinkInput('onlyfans.com/kat').isBlocked).toBe(true)
    expect(validateLinkInput('bit.ly/kat').isShortener).toBe(true)
    expect(validateLinkInput('ko-fi.com/kat').isShortener).toBe(false)
    expect(validateLinkInput('   ').isEmpty).toBe(true)
    expect(validateLinkInput('hello').url).toBe(null)
  })
})
