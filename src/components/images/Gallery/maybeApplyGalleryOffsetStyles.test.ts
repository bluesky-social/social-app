import {type AppBskyFeedDefs, type ModerationUI} from '@atproto/api'

import {maybeApplyGalleryOffsetStyles} from './maybeApplyGalleryOffsetStyles'

describe('maybeApplyGalleryOffsetStyles', () => {
  it('does not offset a record with external media', () => {
    const post = {
      record: {
        $type: 'app.bsky.feed.post',
        createdAt: '2026-07-28T01:02:03.957Z',
        text: '',
        embed: {
          $type: 'app.bsky.embed.recordWithMedia',
          media: {
            $type: 'app.bsky.embed.external',
            external: {
              description: 'A GIF',
              title: 'Let Them Fight',
              uri: 'https://example.com/image.gif',
            },
          },
          record: {
            $type: 'app.bsky.embed.record',
            record: {
              cid: 'bafyrei',
              uri: 'at://did:plc:example/app.bsky.feed.post/example',
            },
          },
        },
      },
    } as unknown as AppBskyFeedDefs.PostView
    const modui = {} as ModerationUI

    expect(maybeApplyGalleryOffsetStyles('meta', {post, modui})).toBeUndefined()
    expect(
      maybeApplyGalleryOffsetStyles('embed', {post, modui}),
    ).toBeUndefined()
  })
})
