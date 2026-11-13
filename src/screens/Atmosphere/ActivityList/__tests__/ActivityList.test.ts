import {type Client} from '@atproto/lex'
import {type AtUriString} from '@atproto/syntax'

import {
  makeActivityListLink,
  MAX_ACTIVITY_LIST_URIS,
  parseActivityListUris,
} from '../links'
import {fetchActivityListPage} from '../useActivityListQuery'

jest.mock('#/state/session', () => ({}))
jest.mock('#/state/preferences/moderation-opts', () => ({}))
jest.mock('#/state/cache/profile-shadow', () => ({}))

function makeUris(count: number) {
  return Array.from(
    {length: count},
    (_, i): AtUriString => `at://did:plc:alice/site.standard.document/${i}`,
  )
}

describe('fetchActivityListPage', () => {
  function setup() {
    // Every third record comes back empty, like a missing or hidden one.
    const call = jest.fn(
      (_method: unknown, {records}: {records: {uri: string}[]}) =>
        Promise.resolve({
          views: records.map(({uri}) =>
            Number(uri.split('/').pop()) % 3 === 0 ? {} : {view: {uri}},
          ),
        }),
    )
    return {client: {call} as unknown as Client, call}
  }

  it('fetches every record, 25 at a time, keeping views aligned', async () => {
    const {client, call} = setup()
    const uris = makeUris(60)
    const items = []
    let cursor: number | undefined = 0
    while (cursor !== undefined) {
      const page = await fetchActivityListPage(client, uris, cursor)
      items.push(...page.items)
      cursor = page.cursor
    }

    expect(items.map(item => item.uri)).toEqual(uris)
    expect(items[0].view).toBeUndefined()
    expect(items[1].view).toEqual({uri: uris[1]})
    expect(call.mock.calls.map(([, input]) => input.records.length)).toEqual([
      25, 25, 10,
    ])
  })

  it('returns an empty page without a request when there are no records', async () => {
    const {client, call} = setup()
    const page = await fetchActivityListPage(client, [], 0)
    expect(page).toEqual({items: [], cursor: undefined})
    expect(call).not.toHaveBeenCalled()
  })
})

describe('activity list links', () => {
  it('round-trips URIs, capped and with invalid ones dropped', () => {
    const uris = makeUris(MAX_ACTIVITY_LIST_URIS + 10)
    const [, param] = makeActivityListLink(uris).split('?uris=')
    expect(parseActivityListUris(param)).toEqual(
      uris.slice(0, MAX_ACTIVITY_LIST_URIS),
    )
    expect(
      parseActivityListUris(encodeURIComponent(`${uris[0]},nope,`)),
    ).toEqual([uris[0]])
  })
})
