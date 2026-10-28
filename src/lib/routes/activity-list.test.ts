import {router} from '#/routes'
import {makeActivityListLink, parseActivityListPosts} from './activity-list'

const ALICE = 'did:plc:alice'
const BOB = 'did:web:bob.example.com'

function post(did: string, rkey: string) {
  return `at://${did}/app.bsky.feed.post/${rkey}`
}

/**
 * Follows a link the way the app does, then reads the posts back out.
 */
function roundTrip(uris: string[]) {
  const [name, params] = router.matchPath(makeActivityListLink(uris))
  expect(name).toBe('NotificationsActivityList')
  return parseActivityListPosts(params.posts)
}

describe('makeActivityListLink', () => {
  it('lists each DID once, then the posts by index', () => {
    const link = makeActivityListLink([
      post(ALICE, '3m2a'),
      post(BOB, '3m2b'),
      post(ALICE, '3m2c'),
    ])
    expect(decodeURIComponent(link)).toBe(
      `/notifications/activity?posts=${ALICE},${BOB},$1/3m2a,$2/3m2b,$1/3m2c`,
    )
  })

  it('keeps every post, in order', () => {
    const uris = Array.from({length: 200}, (_, i) =>
      post(i % 3 ? ALICE : BOB, `3m${i}`),
    )
    expect(roundTrip(uris)).toEqual(uris)
  })

  it('keeps anything that isn’t a post by a DID whole', () => {
    const uris = [
      post(ALICE, '3m2a'),
      'at://alice.example.com/app.bsky.feed.post/3m2b',
      `at://${ALICE}/app.bsky.feed.generator/fungi`,
    ]
    expect(roundTrip(uris)).toEqual(uris)
  })
})

describe('parseActivityListPosts', () => {
  it('reads the older plain list of at-uris', () => {
    const uris = [post(ALICE, '3m2a'), post(BOB, '3m2b')]
    expect(parseActivityListPosts(uris.join(','))).toEqual(uris)
  })

  it('skips entries it can’t read', () => {
    expect(
      parseActivityListPosts(`${ALICE},$1/3m2a,$2/3m2b,$0/3m2c,nonsense,`),
    ).toEqual([post(ALICE, '3m2a')])
  })
})
