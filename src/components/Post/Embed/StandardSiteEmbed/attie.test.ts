import {createAttieCtaUri, isAttieUrl} from './attie'

describe('isAttieUrl', () => {
  it.each([
    'https://attie.site',
    'https://sowing-dewy-sorbet.attie.site/',
    'https://attie.ai/@brittanyellich.com/pages/abc123',
    'https://attie.ai/@brittanyellich.com/pages/abc123/',
  ])('recognizes supported Attie URL %s', uri => {
    expect(isAttieUrl(uri)).toBe(true)
  })

  it.each([
    'http://sowing-dewy-sorbet.attie.site/',
    'https://notattie.site/',
    'https://attie.site.example.com/',
    'https://attie.ai/',
    'https://attie.ai/@brittanyellich.com/',
    'https://attie.ai/@brittanyellich.com/pages/',
    'not a URL',
  ])('does not recognize unsupported URL %s', uri => {
    expect(isAttieUrl(uri)).toBe(false)
  })
})

describe('createAttieCtaUri', () => {
  const viewer = {
    handle: 'viewer.bsky.social',
    did: 'did:plc:viewer',
  }

  it('leaves the URI unchanged without a signed-in viewer', () => {
    const uri = 'https://sowing-dewy-sorbet.attie.site/?ref=post#details'
    expect(createAttieCtaUri(uri, undefined)).toBe(uri)
  })

  it('adds identity hints while retaining other query parameters and fragments', () => {
    const result = new URL(
      createAttieCtaUri(
        'https://sowing-dewy-sorbet.attie.site/?ref=post#details',
        viewer,
      ),
    )

    expect(result.searchParams.get('ref')).toBe('post')
    expect(result.searchParams.get('login_hint')).toBe(viewer.handle)
    expect(result.searchParams.get('viewer_did')).toBe(viewer.did)
    expect(result.hash).toBe('#details')
  })

  it('replaces existing identity hints with the current signed-in viewer', () => {
    const result = new URL(
      createAttieCtaUri(
        'https://attie.ai/@owner/pages/report?login_hint=other&viewer_did=did%3Aplc%3Aother',
        viewer,
      ),
    )

    expect(result.searchParams.get('login_hint')).toBe(viewer.handle)
    expect(result.searchParams.get('viewer_did')).toBe(viewer.did)
  })

  it('does not add hints to a URL outside the Attie card contract', () => {
    const uri = 'https://attie.ai/feeds'
    expect(createAttieCtaUri(uri, viewer)).toBe(uri)
  })
})
