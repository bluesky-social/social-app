import {place, site, social} from '#/lexicons'
import {getContentMetricContextProps} from '../content'

const AUTHOR = 'did:plc:6ayddqghxhciedbaofoxkcbs'
const OTHER = 'did:plc:ifn645rwvsuolxg7o3w7ouo4'
const ref = (did: string, collection: string) => ({
  uri: `at://${did}/${collection}/3k`,
})

it("takes the author from the card's own record, not related ones", () => {
  const view = {
    uri: 'https://example.com/a',
    associatedRefs: [
      ref(OTHER, site.standard.publication.$type),
      ref(AUTHOR, site.standard.document.$type),
    ],
  }
  expect(getContentMetricContextProps('article', view)).toEqual({
    contentType: 'article',
    uri: view.uri,
    authorDid: AUTHOR,
  })
  expect(getContentMetricContextProps('publication', view).authorDid).toBe(
    OTHER,
  )
})

it.each([
  ['gallery', social.grain.gallery.$type],
  ['livestream', place.stream.livestream.$type],
] as const)('finds the %s record', (type, collection) => {
  const view = {
    uri: 'https://example.com',
    associatedRefs: [ref(AUTHOR, collection)],
  }
  expect(getContentMetricContextProps(type, view).authorDid).toBe(AUTHOR)
})

it.each([
  ['no refs', undefined],
  ['no matching record', [ref(AUTHOR, social.grain.photo.$type)]],
  ['an invalid ref', [{uri: 'https://example.com/thing'}]],
])('leaves the author unset with %s', (_name, associatedRefs) => {
  expect(
    getContentMetricContextProps('gallery', {
      uri: 'https://example.com',
      associatedRefs,
    }).authorDid,
  ).toBeUndefined()
})
