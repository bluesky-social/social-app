import {isAttieUrl} from './attie'

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
