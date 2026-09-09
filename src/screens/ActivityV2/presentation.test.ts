import {describe, expect, it} from '@jest/globals'

import {type ActivityGroupRowItem, type ActivityRowItem} from './model'
import {
  buildActivityPresentationListItems,
  resolveActivityActors,
} from './presentation'
import {activityCollections} from './types'

function activity(
  uri: string,
  collection: string = activityCollections.document,
) {
  return {
    $type: 'eric.bsky.atmosphere.getActivity#item' as const,
    record: {
      uri,
      cid: `cid-${uri.split('/').at(-1)}`,
      indexedAt: '2026-09-09T00:00:00.000Z',
    },
    collection,
    viewerState: {subscribed: false},
  }
}

function actor(did: string, handle: string) {
  return {
    did,
    handle,
    avatar: `https://example.com/${did}.jpg`,
  }
}

describe('ActivityV2 presentation', () => {
  it('excludes unknown and invalid actors from subject-group stacks and counts', () => {
    const row: ActivityGroupRowItem = {
      type: 'group',
      key: 'group-subject',
      group: {
        $type: 'eric.bsky.atmosphere.getActivity#group',
        id: 'group-subject',
        groupBy: 'subject',
        collection: activityCollections.grainPhoto,
        indexedAt: '2026-09-09T00:00:00.000Z',
        subject: 'at://did:plc:subject/social.grain.photo/subject',
        items: [
          activity(
            'at://did:plc:alice/social.grain.photo/1',
            activityCollections.grainPhoto,
          ),
          activity(
            'at://did:plc:ghost/social.grain.photo/2',
            activityCollections.grainPhoto,
          ),
          activity(
            'at://did:plc:bob/social.grain.photo/3',
            activityCollections.grainPhoto,
          ),
          activity(
            'at://did:plc:alice/social.grain.photo/4',
            activityCollections.grainPhoto,
          ),
          activity(
            'at://did:plc:bad/social.grain.photo/5',
            activityCollections.grainPhoto,
          ),
        ],
      },
      associatedRecords: {},
      actors: {
        'did:plc:alice': actor('did:plc:alice', 'alice.test'),
        'did:plc:bob': actor('did:plc:bob', 'bob.test'),
        'did:plc:bad': actor('did:plc:bad', 'handle.invalid'),
      },
    }

    const resolved = resolveActivityActors(row)

    expect(resolved?.primary.did).toBe('did:plc:alice')
    expect(resolved?.usableActors.map(value => value.did)).toEqual([
      'did:plc:alice',
      'did:plc:bob',
    ])
    expect(resolved?.othersCount).toBe(1)
    expect(resolved?.profiles.map(profile => profile.did)).toEqual([
      'did:plc:alice',
      'did:plc:bob',
    ])
  })

  it('omits standalone and grouped rows that have no usable actors', () => {
    const standalone: ActivityRowItem = {
      type: 'activity',
      key: 'standalone',
      activity: activity('at://did:plc:ghost/site.standard.document/1'),
      associatedRecords: {},
      actors: {},
    }
    const group: ActivityGroupRowItem = {
      type: 'group',
      key: 'group',
      group: {
        $type: 'eric.bsky.atmosphere.getActivity#group',
        id: 'group',
        groupBy: 'actor',
        collection: activityCollections.document,
        indexedAt: '2026-09-09T00:00:00.000Z',
        actor: 'did:plc:ghost',
        items: [
          activity('at://did:plc:ghost/site.standard.document/1'),
          activity('at://did:plc:ghost/site.standard.document/2'),
        ],
      },
      associatedRecords: {},
      actors: {},
    }

    expect(buildActivityPresentationListItems([standalone])).toEqual([
      {type: 'empty', key: 'empty'},
    ])
    expect(buildActivityPresentationListItems([group])).toEqual([
      {type: 'empty', key: 'empty'},
    ])
  })
})
