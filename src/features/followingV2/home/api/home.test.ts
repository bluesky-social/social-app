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

function createHomeApi({
  timelineCursor,
  startCursor,
}: {timelineCursor?: string; startCursor?: string} = {}) {
  const call = jest.fn(
    (
      method: unknown,
      params: {cursor?: string; since?: string; limit: number},
    ) => {
      if (method === app.bsky.feed.getTimeline) {
        return {
          cursor: timelineCursor,
          startCursor,
          feed: [post(`timeline-${bounds(params)}`)],
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
        `${method === app.bsky.feed.getTimeline ? 'timeline' : 'discover'} ${bounds(params)}`,
    )
  return {api, requested}
}

/** A request's cursor, or its `since` bound. */
function bounds(params: {cursor?: string; since?: string}) {
  return params.since === undefined ? params.cursor : `since:${params.since}`
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

  it('keeps the startCursor getTimeline returns', async () => {
    const more = createHomeApi({timelineCursor: 'more', startCursor: 'start'})
    expect(
      (await more.api.fetch({cursor: undefined, limit: 30})).startCursor,
    ).toBe('start')

    setDev(false)
    const last = createHomeApi({startCursor: 'start'})
    expect(
      (await last.api.fetch({cursor: undefined, limit: 30})).startCursor,
    ).toBe('start')
  })

  it('forwards since to Following, and never falls back to Discover from it', async () => {
    setDev(false)
    const {api, requested} = createHomeApi({startCursor: 'start'})

    const res = await api.fetch({cursor: undefined, since: 'top', limit: 60})

    expect(res).toEqual({
      startCursor: 'start',
      feed: [post('timeline-since:top')],
    })
    expect(requested()).toEqual(['timeline since:top'])
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
