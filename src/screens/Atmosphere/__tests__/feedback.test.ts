import {
  article,
  gallery,
  livestream,
  publication,
} from '#/screens/Atmosphere/ActivityTab/__tests__/fixtures'
import {type ActivityContent} from '#/screens/Atmosphere/ActivityTab/rows'
import {getAtmosphereFeedbackUri} from '#/screens/Atmosphere/feedback'

const DOCUMENT = 'at://did:web:author.test/site.standard.document/1'
const PUBLICATION = 'at://did:web:author.test/site.standard.publication/1'
const GALLERY = 'at://did:web:author.test/social.grain.gallery/1'
const LIVESTREAM = 'at://did:web:author.test/place.stream.livestream/1'

/** Feedback requires a record URI, not the CID required by reporting. */
function ref(uri: string) {
  return {uri, cid: 'invalid-cid'} as NonNullable<
    ActivityContent['view']['associatedRefs']
  >[number]
}

it.each([
  {type: 'article', view: article(), uri: DOCUMENT},
  {type: 'publication', view: publication(), uri: PUBLICATION},
  {type: 'gallery', view: gallery(), uri: GALLERY},
  {type: 'livestream', view: livestream(), uri: LIVESTREAM},
] as const)(
  'targets the exact $type collection, ignoring other associated records',
  ({type, view, uri}) => {
    expect(
      getAtmosphereFeedbackUri({
        type,
        view: {
          ...view,
          associatedRefs: [PUBLICATION, DOCUMENT, GALLERY, LIVESTREAM].map(ref),
        },
      } as ActivityContent),
    ).toBe(uri)
  },
)

it('accepts duplicate references to one distinct record', () => {
  expect(
    getAtmosphereFeedbackUri({
      type: 'article',
      view: article(undefined, {
        associatedRefs: [ref(DOCUMENT), ref(DOCUMENT)],
      }),
    }),
  ).toBe(DOCUMENT)
})

it.each(
  [
    [],
    [DOCUMENT, `${DOCUMENT}2`],
    [PUBLICATION],
    ['https://example.com/article'],
    ['at://did:web:author.test/site.standard.document'],
    ['at://did:web:author.test/site.standard.document.extra/1'],
    [`${DOCUMENT}#/text`],
  ].map(uris => ({uris})),
)(
  'does not invent a target for missing, ambiguous, or non-record references: $uris',
  ({uris}) => {
    expect(
      getAtmosphereFeedbackUri({
        type: 'article',
        view: article(undefined, {associatedRefs: uris.map(ref)}),
      }),
    ).toBeUndefined()
  },
)
