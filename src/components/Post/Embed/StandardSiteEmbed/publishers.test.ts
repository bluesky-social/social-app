import {type app} from '#/lexicons'
import {
  matchStandardSiteHostByPublication,
  matchStandardSiteHostByUrl,
} from './publishers'

jest.mock('#/components/icons/community/Leaflet', () => ({Leaflet: () => null}))
jest.mock('#/components/icons/community/Offprint', () => ({
  Offprint: () => null,
}))
jest.mock('#/components/icons/community/Pckt', () => ({Pckt: () => null}))

function createView({
  uri = 'https://custom.example/article',
  sourceUri = 'https://custom.example',
}: {
  uri?: app.bsky.embed.external.ViewExternal['uri']
  sourceUri?: app.bsky.embed.external.ViewExternalSource['uri']
} = {}): app.bsky.embed.external.ViewExternal {
  return {
    uri,
    title: 'Article',
    description: '',
    source: {
      uri: sourceUri,
      title: 'Publication',
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

  it('falls back to the article host without a publication source', () => {
    const {source: _, ...view} = createView({
      uri: 'https://writer.leaflet.pub/article',
    })
    expect(matchStandardSiteHostByPublication(view)?.name).toBe('Leaflet')
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
})
