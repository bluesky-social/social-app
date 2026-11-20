import {place, site, social} from '#/lexicons'
import {getContentMetricContextProps} from '../content'

const AUTHOR = 'did:plc:6ayddqghxhciedbaofoxkcbs'
const OTHER = 'did:plc:ifn645rwvsuolxg7o3w7ouo4'
const ref = (did: string, collection: string) => ({
  uri: `at://${did}/${collection}/3k`,
})
const rest = {position: 1, section: 'articles'} as const

it("takes the URI from the card's own record, not related ones", () => {
  const view = {
    associatedRefs: [
      ref(OTHER, site.standard.publication.$type),
      ref(AUTHOR, site.standard.document.$type),
    ],
  }
  expect(getContentMetricContextProps('article', view, rest)).toEqual({
    ...rest,
    uri: `at://${AUTHOR}/${site.standard.document.$type}/3k`,
    collection: site.standard.document.$type,
    authorDid: AUTHOR,
  })
  expect(getContentMetricContextProps('publication', view, rest)).toMatchObject(
    {authorDid: OTHER, collection: site.standard.publication.$type},
  )
})

it.each([
  ['gallery', social.grain.gallery.$type],
  ['livestream', place.stream.livestream.$type],
] as const)('finds the %s record', (type, collection) => {
  const view = {associatedRefs: [ref(AUTHOR, collection)]}
  expect(getContentMetricContextProps(type, view, rest)).toMatchObject({
    collection,
    authorDid: AUTHOR,
  })
})

it.each([
  ['no refs', undefined],
  ['no matching record', [ref(AUTHOR, social.grain.photo.$type)]],
  ['an invalid ref', [{uri: 'https://example.com/thing'}]],
])(
  'returns nothing, so the card logs nothing, with %s',
  (_name, associatedRefs) => {
    expect(
      getContentMetricContextProps('gallery', {associatedRefs}, rest),
    ).toBeUndefined()
  },
)
