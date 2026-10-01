import {type ImagePickerAsset} from 'expo-image-picker'
import {describe, expect, jest, test} from '@jest/globals'

/*
 * The scenario builders run through the real adapters, which never read media;
 * the platform metadata helpers are mocked so nothing reaches native modules.
 */
jest.mock('#/view/com/composer/videos/metadata', () => ({
  getVideoMetadata: jest.fn(() =>
    Promise.resolve({
      mimeType: 'video/mp4',
      width: 1920,
      height: 1080,
      duration: 1000,
    }),
  ),
}))
jest.mock('#/lib/media/manip', () => ({
  getImageDim: jest.fn(() => Promise.resolve({width: 100, height: 100})),
}))

import {normalizePostReference} from '#/view/screens/DebugComposer/postUrl'
import {
  buildScenarioInitialState,
  TESTER_DRAFT_FIXTURE,
  TESTER_DRAFT_FIXTURE_ID,
} from '#/view/screens/DebugComposer/scenarios'
import {draftToInitialState} from '#/components/ComposerV2/adapters'
import {type app} from '#/lexicons'

const realPost = {
  uri: 'at://did:plc:realauthor/app.bsky.feed.post/3realrkey',
  cid: 'bafyreirealcid',
  author: {
    did: 'did:plc:realauthor',
    handle: 'real.example.com',
  },
  record: {
    $type: 'app.bsky.feed.post',
    text: 'a real parent post',
    langs: ['en'],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  indexedAt: '2026-01-01T00:00:00.000Z',
} as unknown as app.bsky.feed.defs.PostView

describe('buildScenarioInitialState', () => {
  test('empty produces a single empty post', async () => {
    const state = await buildScenarioInitialState({id: 'empty'})
    expect(state.posts).toHaveLength(1)
    expect(state.posts![0].text).toBe('')
    expect(state.replyTo).toBeUndefined()
  })

  test('text detects the link as an initial media candidate', async () => {
    const state = await buildScenarioInitialState({id: 'text'})
    expect(state.posts![0].text).toContain('https://bsky.app/about')
    expect(state.posts![0].attachments?.media).toEqual({
      kind: 'uri',
      uri: 'https://bsky.app/about',
    })
  })

  test('mention uses the provided real handle', async () => {
    const state = await buildScenarioInitialState({
      id: 'mention',
      handle: 'real.example.com',
    })
    expect(state.posts![0].text).toContain('@real.example.com')
  })

  test('thread provides normalized multi-post data with tags and labels', async () => {
    const state = await buildScenarioInitialState({id: 'thread'})
    expect(state.posts).toHaveLength(3)
    expect(state.posts![0].tags).toEqual(['composer-v2-tester', 'threads'])
    expect(state.posts![1].labels).toEqual(['graphic-media'])
    expect(state.posts![1].langs).toEqual(['en', 'de'])
    expect(state.threadgateAllowRules).toEqual([
      {$type: 'app.bsky.feed.threadgate#mentionRule'},
    ])
  })

  test('draft fixture runs the inbound adapter and keeps unknown gate rules', async () => {
    const state = await buildScenarioInitialState({id: 'draft-fixture'})
    expect(state.draftId).toBe(TESTER_DRAFT_FIXTURE_ID)
    expect(state.posts).toHaveLength(2)
    expect(state.posts![0].labels).toEqual(['graphic-media'])
    expect(state.threadgateAllowRules).toHaveLength(2)
    expect(
      state.threadgateAllowRules!.some(
        rule =>
          (rule as {$type?: string}).$type ===
          'app.bsky.feed.threadgate#composerV2TesterUnknownRule',
      ),
    ).toBe(true)
    expect(state.postgateEmbeddingRules).toEqual([
      {$type: 'app.bsky.feed.postgate#disableRule'},
    ])
  })

  test('draft fixture carries no network-bearing media or fabricated URLs', async () => {
    /*
     * The running tester must never issue requests to fabricated URLs, so
     * the fixture stays free of remote media entirely; real media enters
     * only through the picker. Adapter URL parsing is covered below with
     * test-local synthetic data instead.
     */
    expect(JSON.stringify(TESTER_DRAFT_FIXTURE)).not.toMatch(/https?:\/\//)
    const state = await buildScenarioInitialState({id: 'draft-fixture'})
    for (const post of state.posts!) {
      expect(post.attachments?.media).toBeUndefined()
    }
  })

  test('adapter GIF-URL parsing is exercised with test-local synthetic data', async () => {
    /* Mock-only draft; this shape never reaches the running tester. */
    const state = await draftToInitialState({
      draftId: 'test-only-gif-draft',
      draft: {
        posts: [
          {
            text: 'test-only gif post',
            embedExternals: [
              {
                uri: 'https://media.tenor.com/test-only/fixture.gif?ww=498&hh=280&alt=Test%20GIF',
              },
            ],
          },
        ],
      },
      loadedMedia: new Map(),
    })
    const media = state.posts![0].attachments?.media
    expect(media?.kind).toBe('gif')
  })

  test('reply builds the target from the fetched post, never fabricating refs', async () => {
    const state = await buildScenarioInitialState({id: 'reply', post: realPost})
    expect(state.replyTo).toMatchObject({
      uri: realPost.uri,
      cid: realPost.cid,
      text: 'a real parent post',
      langs: ['en'],
    })
    expect(state.replyTo!.author.did).toBe('did:plc:realauthor')
  })

  test('quote attaches the fetched post as a resolved record with its view', async () => {
    const state = await buildScenarioInitialState({id: 'quote', post: realPost})
    const record = state.posts![0].attachments?.record
    expect(record).toMatchObject({
      kind: 'post',
      record: {uri: realPost.uri, cid: realPost.cid},
    })
  })

  test('media maps picked images and videos to normalized initial input', async () => {
    const imageAssets = [
      {uri: 'file:///tmp/a.jpg', width: 10, height: 20, mimeType: 'image/jpeg'},
      {uri: 'file:///tmp/b.png', width: 30, height: 40, mimeType: 'image/png'},
    ] as ImagePickerAsset[]
    const images = await buildScenarioInitialState({
      id: 'media',
      picked: {type: 'image', assets: imageAssets},
    })
    expect(images.posts![0].attachments?.media).toEqual({
      kind: 'images',
      items: [
        {
          uri: 'file:///tmp/a.jpg',
          width: 10,
          height: 20,
          mimeType: 'image/jpeg',
        },
        {
          uri: 'file:///tmp/b.png',
          width: 30,
          height: 40,
          mimeType: 'image/png',
        },
      ],
    })

    const videoAssets = [
      {
        uri: 'file:///tmp/a.mp4',
        width: 1920,
        height: 1080,
        mimeType: 'video/mp4',
        duration: 1234,
      },
    ] as ImagePickerAsset[]
    const video = await buildScenarioInitialState({
      id: 'media',
      picked: {type: 'video', assets: videoAssets},
    })
    expect(video.posts![0].attachments?.media).toMatchObject({
      kind: 'video',
      item: {uri: 'file:///tmp/a.mp4', mimeType: 'video/mp4', duration: 1234},
    })
  })
})

describe('normalizePostReference', () => {
  test('accepts at-uris and bsky.app post URLs, rejects everything else', () => {
    expect(
      normalizePostReference({
        reference: 'at://did:plc:abc/app.bsky.feed.post/rkey',
      }),
    ).toBe('at://did:plc:abc/app.bsky.feed.post/rkey')
    expect(
      normalizePostReference({
        reference: 'https://bsky.app/profile/user.test/post/3abc',
      }),
    ).toBe('at://user.test/app.bsky.feed.post/3abc')
    expect(
      normalizePostReference({
        reference: 'https://bsky.app/profile/did:plc:abc/post/3abc',
      }),
    ).toBe('at://did:plc:abc/app.bsky.feed.post/3abc')
    expect(normalizePostReference({reference: ''})).toBeUndefined()
    expect(normalizePostReference({reference: 'not a url'})).toBeUndefined()
    expect(
      normalizePostReference({
        reference: 'https://example.com/profile/x/post/y',
      }),
    ).toBeUndefined()
    expect(
      normalizePostReference({reference: 'https://bsky.app/profile/user.test'}),
    ).toBeUndefined()
  })
})
