import {
  findSupportUriInText,
  getSupportProvider,
  isSupportLink,
  normalizeSupportUri,
} from './providers'

describe('getSupportProvider', () => {
  it('matches allowlisted hosts and their subdomains', () => {
    expect(getSupportProvider('https://ko-fi.com/artist')?.id).toBe('kofi')
    expect(getSupportProvider('https://www.patreon.com/artist')?.id).toBe(
      'patreon',
    )
  })

  it('accepts input without a scheme', () => {
    expect(getSupportProvider('ko-fi.com/artist')?.id).toBe('kofi')
  })

  it('requires the path prefix when the allowlist entry has one', () => {
    expect(getSupportProvider('https://github.com/sponsors/someone')?.id).toBe(
      'github',
    )
    expect(getSupportProvider('https://github.com/someone/repo')).toBeNull()
  })

  it('rejects unknown hosts and lookalikes', () => {
    expect(getSupportProvider('https://example.com/ko-fi.com')).toBeNull()
    expect(getSupportProvider('https://ko-fi.com.evil.example')).toBeNull()
    expect(getSupportProvider('not a url')).toBeNull()
  })
})

describe('isSupportLink', () => {
  it('is false for undefined and unknown links', () => {
    expect(isSupportLink(undefined)).toBe(false)
    expect(isSupportLink('https://example.com')).toBe(false)
  })
})

describe('normalizeSupportUri', () => {
  it('rejects input that does not look like a host', () => {
    expect(normalizeSupportUri('hello')).toBeNull()
    expect(normalizeSupportUri('   ')).toBeNull()
  })

  it('accepts any real host, recognized or not', () => {
    expect(normalizeSupportUri('darrinloeliger.com/tip')).toBe(
      'https://darrinloeliger.com/tip',
    )
  })

  it('forces https and adds a scheme when missing', () => {
    expect(normalizeSupportUri('http://ko-fi.com/artist')).toBe(
      'https://ko-fi.com/artist',
    )
    expect(normalizeSupportUri('  ko-fi.com/artist ')).toBe(
      'https://ko-fi.com/artist',
    )
  })
})

describe('findSupportUriInText', () => {
  it('finds the first recognized provider URL in a bio', () => {
    const bio = 'Painter. Prints at example.com/shop. Tips: ko-fi.com/artist'
    expect(findSupportUriInText(bio)).toBe('https://ko-fi.com/artist')
  })

  it('ignores bios with no recognized provider', () => {
    expect(findSupportUriInText('Just here for the posts')).toBeNull()
    expect(findSupportUriInText(undefined)).toBeNull()
  })
})
