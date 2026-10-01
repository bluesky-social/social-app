import {afterEach, describe, expect, jest, test} from '@jest/globals'

import {getImageDim} from '#/lib/media/manip'
import {type ComposerOpts} from '#/state/shell/composer'
import {getVideoMetadata} from '#/view/com/composer/videos/metadata'
import {
  ComposerAdapterError,
  composerOptsToInitialState,
  draftToInitialState,
} from '#/components/ComposerV2/adapters'
import {type ComposerV2OnError} from '#/components/ComposerV2/errors'
import {createThreadStore} from '#/components/ComposerV2/store'
import {type app, type com} from '#/lexicons'
import {
  simulatedUploadWorkers,
  testUploadRuntime,
} from '../../store/__tests__/uploadTestUtils'

jest.mock('#/lib/media/manip', () => ({
  getImageDim: jest.fn(),
}))
jest.mock('#/view/com/composer/videos/metadata', () => ({
  getVideoMetadata: jest.fn(),
}))
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))

const postRef = {
  uri: 'at://did:plc:example/app.bsky.feed.post/abc',
  cid: 'bafyreiexample',
}
const profile = {
  did: 'did:plc:author',
  handle: 'author.test',
  displayName: 'Author',
  avatar: 'https://example.com/avatar.jpg',
} as app.bsky.actor.defs.ProfileViewBasic

function draftPost(
  input: Partial<app.bsky.draft.defs.DraftPost> = {},
): app.bsky.draft.defs.DraftPost {
  return {text: 'draft text', ...input}
}

function imageRef(path: string, alt = '') {
  return {
    $type: 'app.bsky.draft.defs#draftEmbedImage' as const,
    localRef: {
      $type: 'app.bsky.draft.defs#draftEmbedLocalRef' as const,
      path,
    },
    alt,
  }
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('initialization reporting', () => {
  test('adapter validation remains a typed rejection even if the callback throws', async () => {
    const onError = jest.fn<ComposerV2OnError>(() => {
      throw new Error('listener')
    })
    await expect(
      composerOptsToInitialState({
        composerOpts: {
          imageUris: Array.from({length: 11}, () => ({
            uri: 'file:///private',
            width: 10,
            height: 10,
          })),
        },
        onError,
      }),
    ).rejects.toMatchObject({code: 'oversized-images'})
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toEqual({
      source: 'initialization',
      code: 'oversized-images',
      kind: 'validation',
      recovery: 'edit',
    })
  })

  test('draft structural failure is a reported validation rejection', async () => {
    const onError = jest.fn<ComposerV2OnError>()
    const error: unknown = await draftToInitialState({
      draftId: 'draft',
      draft: {posts: [draftPost({embedImages: [imageRef('missing-ref')]})]},
      loadedMedia: new Map(),
      onError,
    }).catch((value: unknown) => value)
    if (!(error instanceof ComposerAdapterError))
      throw new Error('expected adapter error')
    expect(error.code).toBe('missing-local-media')
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toEqual({
      source: 'initialization',
      code: 'missing-local-media',
      kind: 'validation',
      recovery: 'edit',
    })
  })

  test('unexpected initialization rejection remains identical with or without reporting', async () => {
    const cause = new Error('private diagnostic')
    const opts = {
      get text(): string {
        throw cause
      },
    }
    const onError = jest.fn<ComposerV2OnError>()
    await expect(composerOptsToInitialState({composerOpts: opts})).rejects.toBe(
      cause,
    )
    await expect(
      composerOptsToInitialState({composerOpts: opts, onError}),
    ).rejects.toBe(cause)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      {
        source: 'initialization',
        code: 'initial-state-failed',
        kind: 'unexpected',
        recovery: 'none',
      },
      cause,
    )
  })
})

describe('composerOptsToInitialState', () => {
  test('preserves text, explicit attachments, and a serializable reply preview', async () => {
    const moderation = {reason: 'hidden'}
    const quote = {
      ...postRef,
      author: profile,
      text: 'quoted',
    } as unknown as app.bsky.feed.defs.PostView
    const opts = {
      text: '  hello 👩🏽‍🍳  ',
      quote,
      imageUris: [
        {uri: 'file:///one.jpg', width: 100, height: 80, altText: 'one'},
      ],
      replyTo: {
        ...postRef,
        text: 'parent',
        langs: ['en'],
        author: profile,
        embed: {record: {moderation, uri: 'at://record'}},
        moderation,
      },
    } as unknown as ComposerOpts

    const initial = await composerOptsToInitialState({composerOpts: opts})
    const post = initial.posts?.[0]

    expect(post?.text).toBe(opts.text)
    expect(post?.attachments?.record).toEqual({
      kind: 'post',
      record: postRef,
      view: quote,
    })
    expect(post?.attachments?.media).toEqual({
      kind: 'images',
      items: [
        {
          uri: 'file:///one.jpg',
          width: 100,
          height: 80,
          altText: 'one',
        },
      ],
    })
    expect(initial.replyTo).toMatchObject({
      uri: postRef.uri,
      cid: postRef.cid,
      text: 'parent',
      langs: ['en'],
      author: profile,
    })
    expect(initial.replyTo).not.toHaveProperty('moderation')
    expect(initial.replyTo?.embed).not.toHaveProperty('record.moderation')
  })

  test('uses the existing mention precedence and classifies links by attachment slot', async () => {
    const mentioned = await composerOptsToInitialState({
      composerOpts: {mention: 'alice.test'},
    })
    expect(mentioned.posts?.[0].text).toBe('@alice.test ')

    const cases = [
      ['https://bsky.app/profile/alice.test/post/3jz', 'record'],
      ['https://bsky.app/profile/alice.test/feed/custom', 'record'],
      ['https://bsky.app/profile/alice.test/lists/3jz', 'record'],
      ['https://bsky.app/starter-pack/alice.test/3jz', 'record'],
      ['https://example.com/article', 'media'],
      ['https://bsky.app/chat/abc1234', 'media'],
    ] as const

    for (const [uri, slot] of cases) {
      const initial = await composerOptsToInitialState({
        composerOpts: {text: `x ${uri}`},
      })
      expect(initial.posts?.[0].attachments?.[slot]).toEqual({
        kind: 'uri',
        uri,
      })
    }
  })

  test('explicit media suppresses a detected external card while quote wins over a detected post', async () => {
    const initial = await composerOptsToInitialState({
      composerOpts: {
        text: 'https://bsky.app/profile/alice.test/post/detected https://example.com',
        quote: {
          ...postRef,
          author: profile,
          text: 'quote',
        } as unknown as app.bsky.feed.defs.PostView,
        imageUris: [{uri: 'file:///image.jpg', width: 1, height: 1}],
      },
    })
    expect(initial.posts?.[0].attachments).toMatchObject({
      record: {kind: 'post', record: postRef},
      media: {kind: 'images'},
    })
  })

  test('rejects conflicting and oversized explicit media', async () => {
    await expect(
      composerOptsToInitialState({
        composerOpts: {
          imageUris: [{uri: 'file:///image.jpg', width: 1, height: 1}],
          videoUri: {uri: 'file:///video.mp4', width: 1, height: 1},
        },
      }),
    ).rejects.toMatchObject({
      code: 'conflicting-explicit-media',
    })
    await expect(
      composerOptsToInitialState({
        composerOpts: {
          imageUris: Array.from({length: 11}, (_, i) => ({
            uri: `file:///image-${i}.jpg`,
            width: 1,
            height: 1,
          })),
        },
      }),
    ).rejects.toMatchObject({
      code: 'oversized-images',
    })
  })

  test('passes an intent video through for the worker to prepare, without probing', async () => {
    const initial = await composerOptsToInitialState({
      composerOpts: {
        videoUri: {uri: 'file:///video.mp4', width: 320, height: 240},
      },
    })
    expect(initial.posts?.[0].attachments?.media).toEqual({
      kind: 'video',
      item: {
        uri: 'file:///video.mp4',
        width: 320,
        height: 240,
      },
    })
    expect(getVideoMetadata).not.toHaveBeenCalled()
  })

  test('normalizes gate values without cloning and leaves ownership to the store', async () => {
    const defaults = await composerOptsToInitialState({
      composerOpts: {text: 'new'},
    })
    expect(defaults.threadgateAllowRules).toBeUndefined()
    expect(defaults.postgateEmbeddingRules).toEqual([])

    const futureThreadgateRule = {
      $type: 'app.bsky.feed.threadgate#futureRule',
      nested: {enabled: true},
    }
    const futurePostgateRule = {
      $type: 'app.bsky.feed.postgate#futureRule',
      nested: {enabled: true},
    }
    const settings = {
      threadgateAllowRules: [
        {$type: 'app.bsky.feed.threadgate#mentionRule'},
        {$type: 'app.bsky.feed.threadgate#listRule', list: 'at://list'},
        futureThreadgateRule,
      ],
      postgateEmbeddingRules: [
        {$type: 'app.bsky.feed.postgate#disableRule'},
        futurePostgateRule,
      ],
    } as unknown as app.bsky.actor.defs.PostInteractionSettingsPref
    const beforeAdapter = JSON.stringify(settings)
    const initial = await composerOptsToInitialState({
      composerOpts: {text: 'restricted'},
      postInteractionSettings: settings,
    })

    expect(JSON.stringify(settings)).toBe(beforeAdapter)
    expect(initial.threadgateAllowRules).toBe(settings.threadgateAllowRules)
    expect(initial.postgateEmbeddingRules).toBe(settings.postgateEmbeddingRules)

    const store = createThreadStore({
      ...testUploadRuntime,
      initialState: initial,
      resolvers: {} as never,
      __createId: () => 'post-id',
    })
    expect(store.getState().threadgateAllowRules).not.toBe(
      settings.threadgateAllowRules,
    )
    expect(store.getState().postgateEmbeddingRules).not.toBe(
      settings.postgateEmbeddingRules,
    )
    expect(store.getState().threadgateAllowRules?.[2]).not.toBe(
      futureThreadgateRule,
    )
    expect(store.getState().postgateEmbeddingRules[1]).not.toBe(
      futurePostgateRule,
    )

    settings.threadgateAllowRules!.push({
      $type: 'app.bsky.feed.threadgate#followerRule',
    })
    futureThreadgateRule.nested.enabled = false
    futurePostgateRule.nested.enabled = false
    expect(store.getState().threadgateAllowRules).toHaveLength(3)
    expect(
      (
        store.getState().threadgateAllowRules?.[2] as unknown as {
          nested: {enabled: boolean}
        }
      ).nested.enabled,
    ).toBe(true)
    expect(
      (
        store.getState().postgateEmbeddingRules[1] as unknown as {
          nested: {enabled: boolean}
        }
      ).nested.enabled,
    ).toBe(true)
    store.destroy()
  })
})

describe('draftToInitialState', () => {
  test('restores thread-wide gate settings across posts and uses protocol defaults when absent', async () => {
    const absent = await draftToInitialState({
      draftId: 'draft-defaults',
      draft: {posts: [draftPost(), draftPost({text: 'second'})]},
      loadedMedia: new Map(),
    })
    expect(absent.threadgateAllowRules).toBeUndefined()
    expect(absent.postgateEmbeddingRules).toEqual([])

    const draftThreadgateRule = {
      $type: 'app.bsky.feed.threadgate#futureRule',
      nested: {enabled: true},
    }
    const draftPostgateRule = {
      $type: 'app.bsky.feed.postgate#futureRule',
      nested: {enabled: true},
    }
    const draft: app.bsky.draft.defs.Draft = {
      posts: [draftPost({text: 'first'}), draftPost({text: 'second'})],
      threadgateAllow: [draftThreadgateRule] as never,
      postgateEmbeddingRules: [draftPostgateRule] as never,
    }
    const initial = await draftToInitialState({
      draftId: 'draft-gates',
      draft,
      loadedMedia: new Map(),
    })
    expect(initial.threadgateAllowRules).toBe(draft.threadgateAllow)
    expect(initial.postgateEmbeddingRules).toBe(draft.postgateEmbeddingRules)
    expect(initial.posts).toHaveLength(2)

    const store = createThreadStore({
      ...testUploadRuntime,
      initialState: initial,
      resolvers: {} as never,
      __createId: () => 'draft-post-id',
    })
    draft.threadgateAllow!.push({
      $type: 'app.bsky.feed.threadgate#mentionRule',
    } as never)
    draftThreadgateRule.nested.enabled = false
    draftPostgateRule.nested.enabled = false
    expect(store.getState().threadgateAllowRules).toHaveLength(1)
    expect(
      (
        store.getState().threadgateAllowRules?.[0] as unknown as {
          nested: {enabled: boolean}
        }
      ).nested.enabled,
    ).toBe(true)
    expect(
      (
        store.getState().postgateEmbeddingRules[0] as unknown as {
          nested: {enabled: boolean}
        }
      ).nested.enabled,
    ).toBe(true)
    store.destroy()
  })

  test('restores post order, languages, labels, local images, records, and captions', async () => {
    const draft: app.bsky.draft.defs.Draft = {
      langs: ['en', 'de'],
      posts: [
        draftPost({
          text: 'first',
          labels: {
            $type: 'com.atproto.label.defs#selfLabels',
            values: [{val: 'sexual'}],
          },
          embedImages: [imageRef('image:one', 'one')],
          embedRecords: [
            {
              record: postRef as unknown as com.atproto.repo.strongRef.Main,
            },
          ],
        }),
        draftPost({
          text: 'second',
          embedGallery: {items: [imageRef('image:two', 'two')]},
          embedVideos: [
            {
              localRef: {path: 'video:video/mp4:one'},
              alt: 'video',
              captions: [{lang: 'en', content: 'WEBVTT'}],
            },
          ],
        }),
      ],
    }

    await expect(
      draftToInitialState({
        draftId: 'draft-1',
        draft,
        loadedMedia: new Map([
          ['image:one', 'file:///one.jpg'],
          ['image:two', 'file:///two.jpg'],
          ['video:video/mp4:one', 'file:///one.mp4'],
        ]),
      }),
    ).rejects.toMatchObject({
      code: 'conflicting-attachments',
    })

    draft.posts[1].embedVideos = undefined
    const initial = await draftToInitialState({
      draftId: 'draft-1',
      draft,
      loadedMedia: new Map([
        ['image:one', 'file:///one.jpg'],
        ['image:two', 'file:///two.jpg'],
      ]),
    })
    expect(initial).toMatchObject({draftId: 'draft-1', isDirty: false})
    expect(initial.posts?.map(post => post.text)).toEqual(['first', 'second'])
    expect(initial.posts?.map(post => post.langs)).toEqual([
      ['en', 'de'],
      ['en', 'de'],
    ])
    expect(initial.posts?.[0].labels).toEqual(['sexual'])
    expect(initial.posts?.[0].attachments?.record).toEqual({
      kind: 'post',
      record: postRef,
    })
    expect(initial.posts?.[0].attachments?.media).toMatchObject({
      kind: 'images',
      items: [
        {uri: 'file:///one.jpg', localRefPath: 'image:one', altText: 'one'},
      ],
    })
    expect(initial.posts?.[1].attachments?.media).toMatchObject({
      kind: 'images',
      items: [
        {uri: 'file:///two.jpg', localRefPath: 'image:two', altText: 'two'},
      ],
    })
    /* Drafts store no dimensions; the image worker reads them. */
    const media = initial.posts?.[0].attachments?.media
    expect(media?.kind === 'images' && media.items[0]).not.toHaveProperty(
      'width',
    )
    expect(getImageDim).not.toHaveBeenCalled()
  })

  test('preserves combined legacy/gallery order at the 10-image boundary', async () => {
    const refs = Array.from({length: 10}, (_, index) =>
      imageRef(`image:${index}`),
    )
    const initial = await draftToInitialState({
      draftId: 'draft-gallery',
      draft: {
        posts: [
          draftPost({
            embedImages: refs.slice(0, 4),
            embedGallery: {items: refs.slice(4)},
          }),
        ],
      },
      loadedMedia: new Map(
        refs.map((ref, index) => [
          ref.localRef.path,
          `file:///image-${index}.jpg`,
        ]),
      ),
    })
    expect(initial.posts?.[0].attachments?.media).toMatchObject({
      kind: 'images',
      items: refs.map((ref, index) => ({
        uri: `file:///image-${index}.jpg`,
        localRefPath: ref.localRef.path,
      })),
    })

    await expect(
      draftToInitialState({
        draftId: 'draft-overflow',
        draft: {
          posts: [
            draftPost({embedGallery: {items: [...refs, imageRef('image:10')]}}),
          ],
        },
        loadedMedia: new Map(
          [...refs, imageRef('image:10')].map((ref, index) => [
            ref.localRef.path,
            `file:///image-${index}.jpg`,
          ]),
        ),
      }),
    ).rejects.toMatchObject({code: 'oversized-images'})
  })

  test('restores video source, local-ref MIME type, and all captions without probing', async () => {
    const initial = await draftToInitialState({
      draftId: 'draft-video',
      draft: {
        posts: [
          draftPost({
            embedVideos: [
              {
                localRef: {path: 'video:video/webm:one'},
                alt: 'clip',
                captions: [
                  {lang: 'en', content: 'one'},
                  {lang: 'fr', content: 'two'},
                ],
              },
            ],
          }),
        ],
      },
      loadedMedia: new Map([['video:video/webm:one', 'file:///clip.webm']]),
    })
    /* Only the local ref's MIME type is known; the worker reads the rest. */
    expect(initial.posts?.[0].attachments?.media).toEqual({
      kind: 'video',
      item: {
        uri: 'file:///clip.webm',
        mimeType: 'video/webm',
        altText: 'clip',
        localRefPath: 'video:video/webm:one',
        captions: [
          {lang: 'en', content: 'one'},
          {lang: 'fr', content: 'two'},
        ],
      },
    })
    expect(getVideoMetadata).not.toHaveBeenCalled()
  })

  test('keeps the legacy local-ref MIME fallback and marks GIF files by type', async () => {
    const initial = await draftToInitialState({
      draftId: 'draft-video-types',
      draft: {
        posts: [
          draftPost({embedVideos: [{localRef: {path: 'video:legacy-id'}}]}),
          draftPost({
            embedVideos: [{localRef: {path: 'video:image/gif:one'}}],
          }),
        ],
      },
      loadedMedia: new Map([
        ['video:legacy-id', 'file:///legacy'],
        ['video:image/gif:one', 'file:///animated'],
      ]),
    })
    expect(
      initial.posts?.map(post => {
        const media = post.attachments?.media
        return media?.kind === 'video' ? media.item.mimeType : undefined
      }),
    ).toEqual(['video/mp4', 'image/gif'])
  })

  test('classifies draft external URLs and reconstructs provider GIFs', async () => {
    const gifUri =
      'https://static.klipy.com/ii/example.gif?ww=320&hh=240&alt=hello&mp4=clip'
    const initial = await draftToInitialState({
      draftId: 'draft-links',
      draft: {
        posts: [
          draftPost({
            embedExternals: [{uri: gifUri}],
          }),
        ],
      },
      loadedMedia: new Map(),
    })
    const media = initial.posts?.[0].attachments?.media
    expect(media?.kind).toBe('gif')
    if (media?.kind === 'gif') {
      expect(media.item.gif.media_formats.mp4?.url).toContain('clip.mp4')
      expect(media.item.gif.media_formats.gif.dims).toEqual([320, 240])
    }

    const record = await draftToInitialState({
      draftId: 'draft-record-url',
      draft: {
        posts: [
          draftPost({
            embedExternals: [
              {uri: 'https://bsky.app/profile/alice.test/feed/custom'},
            ],
          }),
        ],
      },
      loadedMedia: new Map(),
    })
    expect(record.posts?.[0].attachments?.record).toEqual({
      kind: 'uri',
      uri: 'https://bsky.app/profile/alice.test/feed/custom',
    })
    expect(record.posts?.[0].attachments?.media).toBeUndefined()
  })

  test('surfaces missing media and unsupported content', async () => {
    await expect(
      draftToInitialState({
        draftId: 'missing',
        draft: {posts: [draftPost({embedImages: [imageRef('missing')]})]},
        loadedMedia: new Map(),
      }),
    ).rejects.toMatchObject({
      code: 'missing-local-media',
    })

    await expect(
      draftToInitialState({
        draftId: 'unsupported-gallery',
        draft: {
          posts: [
            draftPost({
              embedGallery: {items: [{unknown: true} as never]},
            }),
          ],
        },
        loadedMedia: new Map(),
      }),
    ).rejects.toMatchObject({code: 'unsupported-gallery-entry'})

    await expect(
      draftToInitialState({
        draftId: 'unsupported',
        draft: {
          posts: [
            draftPost({
              embedRecords: [
                {
                  record: {
                    uri: 'at://did:plc:example/app.bsky.graph.mute/one',
                    cid: 'cid',
                  },
                },
              ],
            }),
          ],
        },
        loadedMedia: new Map(),
      }),
    ).rejects.toMatchObject({
      code: 'unsupported-record',
    })
  })

  test('feeds each normalized adapter result directly into a clean store snapshot', async () => {
    jest.useFakeTimers()
    const initial = await composerOptsToInitialState({
      composerOpts: {
        quote: {
          ...postRef,
          author: profile,
          text: 'quote',
        } as unknown as app.bsky.feed.defs.PostView,
        replyTo: {
          ...postRef,
          text: 'parent',
          author: profile,
        },
        imageUris: [{uri: 'file:///image.jpg', width: 1, height: 1}],
      },
    })
    const store = createThreadStore({
      ...testUploadRuntime,
      initialState: initial,
      resolvers: {} as never,
      __createId: (() => {
        let id = 0
        return () => `id-${++id}`
      })(),
      __uploadWorkers: simulatedUploadWorkers,
    })
    const post = Object.values(store.getState().posts)[0]
    expect(store.getState().isDirty).toBe(false)
    expect(store.getState().replyTo).toMatchObject({
      uri: postRef.uri,
      text: 'parent',
    })
    expect(post.attachments.record).toMatchObject({kind: 'post'})
    expect(post.attachments.media).toMatchObject({kind: 'images'})
    expect(jest.getTimerCount()).toBe(1)
    store.destroy()

    const draftInitial = await draftToInitialState({
      draftId: 'draft-store',
      draft: {posts: [draftPost({text: 'draft text'})]},
      loadedMedia: new Map(),
    })
    const draftStore = createThreadStore({
      ...testUploadRuntime,
      initialState: draftInitial,
      resolvers: {} as never,
      __createId: () => 'draft-post-id',
    })
    expect(Object.values(draftStore.getState().posts)[0].text).toBe(
      'draft text',
    )
    expect(draftStore.getState().isDirty).toBe(false)
    draftStore.destroy()
    jest.useRealTimers()
  })
})
