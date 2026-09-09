import {describe, expect, it} from '@jest/globals'

import {type ActivityGroupRowItem, buildActivityListItems} from './model'
import {type AtmosphereActivityPage} from './types'

const documentUri = 'at://did:plc:author/site.standard.document/one'

function activity(uri: string, subscribed = false) {
  return {
    $type: 'eric.bsky.atmosphere.getActivity#item' as const,
    record: {
      uri,
      cid: `bafy-${uri.at(-1)}`,
      indexedAt: '2026-09-03T00:00:00.000Z',
    },
    viewerState: {subscribed},
  }
}

function page(
  values: Partial<AtmosphereActivityPage> = {},
): AtmosphereActivityPage {
  return {
    feed: [],
    associatedRecords: {},
    actors: {},
    ...values,
  }
}

describe('ActivityV2 list model', () => {
  it('returns loading, error, and empty list states', () => {
    expect(buildActivityListItems(undefined)).toEqual([
      {type: 'loading', key: 'loading'},
    ])
    expect(buildActivityListItems(undefined, 'boom')).toEqual([
      {type: 'error', key: 'error', error: 'boom'},
    ])
    expect(
      buildActivityListItems({pages: [page()], pageParams: [undefined]}),
    ).toEqual([{type: 'empty', key: 'empty'}])
  })

  it('preserves groups as outer rows with ordered child activity', () => {
    const secondDocumentUri = 'at://did:plc:author/site.standard.document/two'
    const items = buildActivityListItems({
      pages: [
        page({
          feed: [
            {
              $type: 'eric.bsky.atmosphere.getActivity#group',
              id: 'opaque-group-id',
              groupBy: 'actor',
              collection: 'site.standard.document',
              indexedAt: '2026-09-03T00:00:00.000Z',
              actor: 'did:plc:author',
              items: [
                activity(documentUri, true),
                activity(secondDocumentUri, false),
              ],
            },
          ],
        }),
      ],
      pageParams: [undefined],
    })

    expect(items).toHaveLength(1)
    const group = items[0] as ActivityGroupRowItem
    expect(group.type).toBe('group')
    expect(group.group.items.map(item => item.record.uri)).toEqual([
      documentUri,
      secondDocumentUri,
    ])
    expect(group.group.items.map(item => item.viewerState.subscribed)).toEqual([
      true,
      false,
    ])
  })
})
