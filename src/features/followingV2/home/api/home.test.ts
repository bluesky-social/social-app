import {type Client} from '@atproto/lex'

import {app} from '#/lexicons'
import {FALLBACK_MARKER_POST, HomeFeedAPI} from './home'

jest.mock('#/state/preferences/languages', () => ({
  getAppLanguageAsContentLanguage: () => '',
  getContentLanguages: () => [],
}))

/** `__DEV__` decides whether Home's fallback goes on to fetch Discover. */
function setDev(value: boolean) {
  Object.assign(globalThis, {__DEV__: value})
}

/** Posts are named `<endpoint>-<cursor>`, to show where a page came from. */
function post(name: string) {
  return {post: {uri: name}} as unknown as app.bsky.feed.defs.FeedViewPost
}

function createHomeApi({timelineCursor}: {timelineCursor?: string} = {}) {
  const call = jest.fn(
    (method: unknown, params: {cursor?: string; limit: number}) => {
      if (method === app.bsky.feed.getTimeline) {
        return {
          cursor: timelineCursor,
          feed: [post(`timeline-${params.cursor}`)],
        }
      }
      if (method === app.bsky.feed.getFeed) {
        return {cursor: 'next', feed: [post(`discover-${params.cursor}`)]}
      }
      throw new Error('Unexpected request')
    },
  )
  const api = new HomeFeedAPI({
    client: {did: 'did:plc:viewer', call} as unknown as Client,
  })
  const requested = () =>
    call.mock.calls.map(
      ([method, params]) =>
        `${method === app.bsky.feed.getTimeline ? 'timeline' : 'discover'} ${params.cursor}`,
    )
  return {api, requested}
}

describe('HomeFeedAPI', () => {
  const dev = __DEV__
  afterEach(() => {
    setDev(dev)
  })

  it('reads Following while it has more', async () => {
    const {api, requested} = createHomeApi({timelineCursor: 'more'})

    const res = await api.fetch({cursor: 'top', limit: 30})

    expect(res).toEqual({cursor: 'more', feed: [post('timeline-top')]})
    expect(requested()).toEqual(['timeline top'])
  })

  it('carries on into Discover once Following runs out', async () => {
    setDev(false)
    const {api, requested} = createHomeApi()

    const res = await api.fetch({cursor: 'last', limit: 30})

    expect(res).toEqual({
      cursor: 'next',
      source: 'discover',
      feed: [post('timeline-last'), FALLBACK_MARKER_POST, post('discover-')],
    })
    expect(requested()).toEqual(['timeline last', 'discover '])
  })

  it('stops at the fallback marker in dev', async () => {
    setDev(true)
    const {api, requested} = createHomeApi()

    const res = await api.fetch({cursor: undefined, limit: 30})

    expect(res).toEqual({
      source: 'discover',
      feed: [post('timeline-undefined'), FALLBACK_MARKER_POST],
    })
    expect(requested()).toEqual(['timeline undefined'])
  })

  it('continues a Discover page from Discover alone', async () => {
    const {api, requested} = createHomeApi({timelineCursor: 'more'})

    const res = await api.fetch({cursor: 'next', source: 'discover', limit: 30})

    expect(res).toEqual({
      cursor: 'next',
      source: 'discover',
      feed: [post('discover-next')],
    })
    expect(requested()).toEqual(['discover next'])
  })

  it('peeks at the source it is given', async () => {
    const {api, requested} = createHomeApi()

    await api.peekLatest()
    await api.peekLatest({source: 'discover'})

    expect(requested()).toEqual(['timeline undefined', 'discover undefined'])
  })
})
