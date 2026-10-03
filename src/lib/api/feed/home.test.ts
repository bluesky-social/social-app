import {type Client} from '@atproto/lex'

import {app} from '#/lexicons'
import {HomeFeedAPI} from './home'

jest.mock('#/state/preferences/languages', () => ({
  getContentLanguages: () => [],
}))

describe('HomeFeedAPI', () => {
  it('rebinds its child feeds without losing the discover fallback', async () => {
    const oldCall = jest.fn().mockRejectedValue(new Error('session disposed'))
    const newCall = jest.fn().mockResolvedValue({feed: [{}]})
    const api = new HomeFeedAPI({
      client: {call: oldCall} as unknown as Client,
    })
    api.usingDiscover = true
    api.itemCursor = 7
    const following = api.following
    const discover = api.discover

    const client = {call: newCall} as unknown as Client
    api.setClient(client)

    expect(api.following).toBe(following)
    expect(api.discover).toBe(discover)
    expect(api.usingDiscover).toBe(true)
    expect(api.itemCursor).toBe(7)
    expect(following.client).toBe(client)
    expect(discover.client).toBe(client)
    await api.peekLatest()
    expect(newCall).toHaveBeenCalledWith(
      app.bsky.feed.getFeed,
      expect.objectContaining({limit: 1}),
      expect.anything(),
    )
    expect(oldCall).not.toHaveBeenCalled()
  })
})
