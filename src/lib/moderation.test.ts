import {type DidString} from '@atproto/syntax'
import {type ModerationOpts} from '@bsky/sdk/moderation'

import {type app, type com} from '#/lexicons'
import {moderateViewExternal} from './moderation'

const LABELER_DID: DidString = 'did:plc:labeler'

const opts: ModerationOpts = {
  userDid: 'did:plc:viewer',
  prefs: {
    adultContentEnabled: true,
    labels: {
      porn: 'hide',
      'graphic-media': 'warn',
    },
    labelers: [
      {
        did: LABELER_DID,
        labels: {},
      },
    ],
    mutedWords: [],
    hiddenPosts: [],
  },
}

function label(val: string, src: DidString): com.atproto.label.defs.Label {
  return {
    val,
    src,
    uri: 'https://example.com/article',
    cts: '2025-01-01T00:00:00.000Z',
  }
}

function viewExternal(
  labels?: app.bsky.embed.external.ViewExternal['labels'],
): app.bsky.embed.external.ViewExternal {
  return {
    uri: 'https://example.com/article',
    title: 'Example article',
    description: 'An example article',
    labels,
  }
}

describe('moderateViewExternal', () => {
  it('produces no causes when the view has no labels', () => {
    const decision = moderateViewExternal(viewExternal(), opts)
    expect(decision.causes).toHaveLength(0)
  })

  it('blurs contentMedia for a media label from a subscribed labeler', () => {
    const decision = moderateViewExternal(
      viewExternal([label('porn', LABELER_DID)]),
      opts,
    )
    expect(decision.ui('contentMedia').blurs).toHaveLength(1)
  })

  it('blurs contentView for a content label from a subscribed labeler', () => {
    const decision = moderateViewExternal(
      viewExternal([label('!warn', LABELER_DID)]),
      opts,
    )
    expect(decision.ui('contentView').blurs).toHaveLength(1)
    expect(decision.ui('contentMedia').blurs).toHaveLength(0)
  })

  it('ignores labels from labelers the viewer is not subscribed to', () => {
    const decision = moderateViewExternal(
      viewExternal([label('porn', 'did:plc:unknown-labeler')]),
      opts,
    )
    expect(decision.causes).toHaveLength(0)
  })
})
