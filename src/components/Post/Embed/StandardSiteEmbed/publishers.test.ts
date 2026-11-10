import {type app} from '#/lexicons'
import {
  matchStandardSiteHostByPublication,
  matchStandardSiteHostByUrl,
  matchStandardSitePublisherByViewHints,
} from './publishers'

jest.mock('#/components/icons/community/Leaflet', () => ({Leaflet: () => null}))
jest.mock('#/components/icons/community/Offprint', () => ({
  Offprint: () => null,
}))
jest.mock('#/components/icons/community/Pckt', () => ({Pckt: () => null}))

function createView({
  uri = 'https://custom.example/article',
  sourceUri = 'https://custom.example',
  themeType,
}: {
  uri?: app.bsky.embed.external.ViewExternal['uri']
  sourceUri?: app.bsky.embed.external.ViewExternalSource['uri']
  themeType?: unknown
} = {}): app.bsky.embed.external.ViewExternal {
  return {
    uri,
    title: 'Article',
    description: '',
    source: {
      uri: sourceUri,
      title: 'Publication',
      theme: {
        $type: themeType,
      } as app.bsky.embed.external.ViewExternalSourceTheme,
    },
  }
}

describe('standard site publisher matching', () => {
  it('matches the publication source independently of the article host', () => {
    expect(
      matchStandardSiteHostByPublication(
        createView({sourceUri: 'https://writer.leaflet.pub'}),
      )?.name,
    ).toBe('Leaflet')
    expect(
      matchStandardSiteHostByPublication(
        createView({uri: 'https://writer.leaflet.pub/article'}),
      ),
    ).toBeNull()
  })

  it.each([
    ['https://leaflet.pub/article', 'Leaflet'],
    ['https://writer.pckt.blog/article', 'pckt'],
    ['https://offprint.app/article', 'Offprint'],
    ['https://notleaflet.pub/article', undefined],
    ['https://leaflet.pub.example/article', undefined],
    ['invalid URL', undefined],
    [undefined, undefined],
  ])(
    'matches only exact publisher domains and subdomains (%s)',
    (url, name) => {
      expect(matchStandardSiteHostByUrl(url)?.name).toBe(name)
    },
  )

  it('prefers source URL evidence to article URLs and theme hints', () => {
    expect(
      matchStandardSitePublisherByViewHints(
        createView({
          sourceUri: 'https://writer.leaflet.pub',
          uri: 'https://writer.pckt.blog/article',
          themeType: 'app.offprint.theme',
        }),
      )?.name,
    ).toBe('Leaflet')
  })

  it('uses the article URL before theme hints on custom publication domains', () => {
    expect(
      matchStandardSitePublisherByViewHints(
        createView({
          uri: 'https://writer.pckt.blog/article',
          themeType: 'app.offprint.theme',
        }),
      )?.name,
    ).toBe('pckt')
  })

  it.each([
    ['pub.leaflet', 'Leaflet'],
    ['pub.leaflet.theme', 'Leaflet'],
    ['blog.pckt#theme', 'pckt'],
    ['app.offprint.theme', 'Offprint'],
    ['pub.leafletish.theme', undefined],
    ['site.standard.theme', undefined],
    [123, undefined],
    [undefined, undefined],
  ])('retains bounded vendor theme NSID hints (%s)', (themeType, name) => {
    expect(
      matchStandardSitePublisherByViewHints(createView({themeType}))?.name,
    ).toBe(name)
  })

  it('handles views without a publication source', () => {
    const view = createView()
    delete view.source
    expect(matchStandardSitePublisherByViewHints(view)).toBeNull()
  })
})
