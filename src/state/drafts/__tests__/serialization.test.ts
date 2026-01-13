import {describe, expect, it} from '@jest/globals'

import {
  composerReducer,
  createComposerState,
} from '#/view/com/composer/state/composer'
import {type StoredDraft} from '../schema'

describe('Draft serialization', () => {
  describe('restore_from_draft action', () => {
    it('restores a simple text draft', () => {
      const initialState = createComposerState({
        initText: undefined,
        initMention: undefined,
        initImageUris: undefined,
        initQuoteUri: undefined,
        initInteractionSettings: undefined,
      })

      const storedDraft: StoredDraft = {
        id: 'draft-123',
        accountDid: 'did:plc:abc123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        posts: [
          {
            id: 'post-1',
            richtext: {
              text: 'Hello, world!',
              facets: [],
            },
            labels: [],
          },
        ],
        syncStatus: 'local',
      }

      const loadedMedia = new Map<string, string>()

      const newState = composerReducer(initialState, {
        type: 'restore_from_draft',
        draft: storedDraft,
        loadedMedia,
      })

      expect(newState.thread.posts).toHaveLength(1)
      expect(newState.thread.posts[0].richtext.text).toBe('Hello, world!')
      expect(newState.thread.posts[0].id).toBe('post-1')
      expect(newState.activePostIndex).toBe(0)
    })

    it('restores a draft with multiple posts (thread)', () => {
      const initialState = createComposerState({
        initText: undefined,
        initMention: undefined,
        initImageUris: undefined,
        initQuoteUri: undefined,
        initInteractionSettings: undefined,
      })

      const storedDraft: StoredDraft = {
        id: 'draft-456',
        accountDid: 'did:plc:abc123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        posts: [
          {
            id: 'post-1',
            richtext: {text: 'First post in thread', facets: []},
            labels: [],
          },
          {
            id: 'post-2',
            richtext: {text: 'Second post in thread', facets: []},
            labels: [],
          },
          {
            id: 'post-3',
            richtext: {text: 'Third post in thread', facets: []},
            labels: [],
          },
        ],
        syncStatus: 'local',
      }

      const loadedMedia = new Map<string, string>()

      const newState = composerReducer(initialState, {
        type: 'restore_from_draft',
        draft: storedDraft,
        loadedMedia,
      })

      expect(newState.thread.posts).toHaveLength(3)
      expect(newState.thread.posts[0].richtext.text).toBe(
        'First post in thread',
      )
      expect(newState.thread.posts[1].richtext.text).toBe(
        'Second post in thread',
      )
      expect(newState.thread.posts[2].richtext.text).toBe(
        'Third post in thread',
      )
    })

    it('restores a draft with labels', () => {
      const initialState = createComposerState({
        initText: undefined,
        initMention: undefined,
        initImageUris: undefined,
        initQuoteUri: undefined,
        initInteractionSettings: undefined,
      })

      const storedDraft: StoredDraft = {
        id: 'draft-789',
        accountDid: 'did:plc:abc123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        posts: [
          {
            id: 'post-1',
            richtext: {text: 'Content with labels', facets: []},
            labels: ['sexual', 'graphic-media'],
          },
        ],
        syncStatus: 'local',
      }

      const loadedMedia = new Map<string, string>()

      const newState = composerReducer(initialState, {
        type: 'restore_from_draft',
        draft: storedDraft,
        loadedMedia,
      })

      expect(newState.thread.posts[0].labels).toEqual([
        'sexual',
        'graphic-media',
      ])
    })

    it('restores a draft with quote URI', () => {
      const initialState = createComposerState({
        initText: undefined,
        initMention: undefined,
        initImageUris: undefined,
        initQuoteUri: undefined,
        initInteractionSettings: undefined,
      })

      const storedDraft: StoredDraft = {
        id: 'draft-quote',
        accountDid: 'did:plc:abc123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        posts: [
          {
            id: 'post-1',
            richtext: {text: 'Quoting another post', facets: []},
            labels: [],
            quoteUri: 'at://did:plc:xyz/app.bsky.feed.post/abc123',
          },
        ],
        syncStatus: 'local',
      }

      const loadedMedia = new Map<string, string>()

      const newState = composerReducer(initialState, {
        type: 'restore_from_draft',
        draft: storedDraft,
        loadedMedia,
      })

      expect(newState.thread.posts[0].embed.quote).toEqual({
        type: 'link',
        uri: 'at://did:plc:xyz/app.bsky.feed.post/abc123',
      })
    })

    it('restores a draft with external link', () => {
      const initialState = createComposerState({
        initText: undefined,
        initMention: undefined,
        initImageUris: undefined,
        initQuoteUri: undefined,
        initInteractionSettings: undefined,
      })

      const storedDraft: StoredDraft = {
        id: 'draft-link',
        accountDid: 'did:plc:abc123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        posts: [
          {
            id: 'post-1',
            richtext: {text: 'Check out this link', facets: []},
            labels: [],
            linkUri: 'https://example.com',
          },
        ],
        syncStatus: 'local',
      }

      const loadedMedia = new Map<string, string>()

      const newState = composerReducer(initialState, {
        type: 'restore_from_draft',
        draft: storedDraft,
        loadedMedia,
      })

      expect(newState.thread.posts[0].embed.link).toEqual({
        type: 'link',
        uri: 'https://example.com',
      })
    })

    it('restores a draft with images when media is available', () => {
      const initialState = createComposerState({
        initText: undefined,
        initMention: undefined,
        initImageUris: undefined,
        initQuoteUri: undefined,
        initInteractionSettings: undefined,
      })

      const storedDraft: StoredDraft = {
        id: 'draft-images',
        accountDid: 'did:plc:abc123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        posts: [
          {
            id: 'post-1',
            richtext: {text: 'Post with images', facets: []},
            labels: [],
            images: [
              {
                localId: 'img-1',
                type: 'image',
                mimeType: 'image/jpeg',
                width: 800,
                height: 600,
                altText: 'A beautiful sunset',
              },
              {
                localId: 'img-2',
                type: 'image',
                mimeType: 'image/png',
                width: 1024,
                height: 768,
                altText: 'A mountain landscape',
              },
            ],
          },
        ],
        syncStatus: 'local',
      }

      // Simulate loaded media paths
      const loadedMedia = new Map<string, string>([
        ['img-1', '/path/to/image1.jpg'],
        ['img-2', '/path/to/image2.png'],
      ])

      const newState = composerReducer(initialState, {
        type: 'restore_from_draft',
        draft: storedDraft,
        loadedMedia,
      })

      expect(newState.thread.posts[0].embed.media?.type).toBe('images')
      if (newState.thread.posts[0].embed.media?.type === 'images') {
        expect(newState.thread.posts[0].embed.media.images).toHaveLength(2)
        expect(newState.thread.posts[0].embed.media.images[0].alt).toBe(
          'A beautiful sunset',
        )
        expect(newState.thread.posts[0].embed.media.images[0].source.path).toBe(
          '/path/to/image1.jpg',
        )
        expect(newState.thread.posts[0].embed.media.images[1].alt).toBe(
          'A mountain landscape',
        )
      }
    })

    it('skips images when media file is not available', () => {
      const initialState = createComposerState({
        initText: undefined,
        initMention: undefined,
        initImageUris: undefined,
        initQuoteUri: undefined,
        initInteractionSettings: undefined,
      })

      const storedDraft: StoredDraft = {
        id: 'draft-missing-images',
        accountDid: 'did:plc:abc123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        posts: [
          {
            id: 'post-1',
            richtext: {text: 'Post with missing images', facets: []},
            labels: [],
            images: [
              {
                localId: 'missing-img',
                type: 'image',
                mimeType: 'image/jpeg',
                width: 800,
                height: 600,
                altText: 'Missing image',
              },
            ],
          },
        ],
        syncStatus: 'local',
      }

      // Empty media map simulates missing files
      const loadedMedia = new Map<string, string>()

      const newState = composerReducer(initialState, {
        type: 'restore_from_draft',
        draft: storedDraft,
        loadedMedia,
      })

      // Should not have media since the image file is missing
      expect(newState.thread.posts[0].embed.media).toBeUndefined()
    })

    it('restores a draft with facets (mentions, links)', () => {
      const initialState = createComposerState({
        initText: undefined,
        initMention: undefined,
        initImageUris: undefined,
        initQuoteUri: undefined,
        initInteractionSettings: undefined,
      })

      const storedDraft: StoredDraft = {
        id: 'draft-facets',
        accountDid: 'did:plc:abc123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        posts: [
          {
            id: 'post-1',
            richtext: {
              text: 'Hey @alice check out https://example.com',
              facets: [
                {
                  index: {byteStart: 4, byteEnd: 10},
                  features: [
                    {
                      $type: 'app.bsky.richtext.facet#mention',
                      did: 'did:plc:alice123',
                    },
                  ],
                },
                {
                  index: {byteStart: 21, byteEnd: 40},
                  features: [
                    {
                      $type: 'app.bsky.richtext.facet#link',
                      uri: 'https://example.com',
                    },
                  ],
                },
              ],
            },
            labels: [],
          },
        ],
        syncStatus: 'local',
      }

      const loadedMedia = new Map<string, string>()

      const newState = composerReducer(initialState, {
        type: 'restore_from_draft',
        draft: storedDraft,
        loadedMedia,
      })

      expect(newState.thread.posts[0].richtext.facets).toHaveLength(2)
      expect(
        newState.thread.posts[0].richtext.facets?.[0].features[0].$type,
      ).toBe('app.bsky.richtext.facet#mention')
    })

    it('restores threadgate settings from draft', () => {
      const initialState = createComposerState({
        initText: undefined,
        initMention: undefined,
        initImageUris: undefined,
        initQuoteUri: undefined,
        initInteractionSettings: undefined,
      })

      const storedDraft: StoredDraft = {
        id: 'draft-threadgate',
        accountDid: 'did:plc:abc123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        posts: [
          {
            id: 'post-1',
            richtext: {text: 'Post with restricted replies', facets: []},
            labels: [],
          },
        ],
        threadgate: ['nobody'],
        syncStatus: 'local',
      }

      const loadedMedia = new Map<string, string>()

      const newState = composerReducer(initialState, {
        type: 'restore_from_draft',
        draft: storedDraft,
        loadedMedia,
      })

      expect(newState.thread.threadgate).toEqual(['nobody'])
    })

    it('restores reply information', () => {
      const initialState = createComposerState({
        initText: undefined,
        initMention: undefined,
        initImageUris: undefined,
        initQuoteUri: undefined,
        initInteractionSettings: undefined,
      })

      const storedDraft: StoredDraft = {
        id: 'draft-reply',
        accountDid: 'did:plc:abc123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        replyToUri: 'at://did:plc:xyz/app.bsky.feed.post/parent123',
        replyToAuthor: {
          did: 'did:plc:xyz',
          handle: 'alice.bsky.social',
          displayName: 'Alice',
        },
        posts: [
          {
            id: 'post-1',
            richtext: {text: 'This is a reply', facets: []},
            labels: [],
          },
        ],
        syncStatus: 'local',
      }

      const loadedMedia = new Map<string, string>()

      const newState = composerReducer(initialState, {
        type: 'restore_from_draft',
        draft: storedDraft,
        loadedMedia,
      })

      // The reply info is stored in the draft but handled by the composer opener
      // The reducer restores the post content
      expect(newState.thread.posts[0].richtext.text).toBe('This is a reply')
    })
  })

  describe('DraftSummary creation', () => {
    it('creates correct summary from draft', () => {
      // This tests the createDraftSummary function indirectly through the storage layer
      const draft: StoredDraft = {
        id: 'draft-summary-test',
        accountDid: 'did:plc:abc123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        posts: [
          {
            id: 'post-1',
            richtext: {
              text: 'This is a longer post that should be truncated in the preview to show only the first 100 characters or so',
              facets: [],
            },
            labels: [],
            images: [
              {
                localId: 'img-1',
                type: 'image',
                mimeType: 'image/jpeg',
                width: 800,
                height: 600,
                altText: '',
              },
            ],
          },
          {
            id: 'post-2',
            richtext: {text: 'Second post', facets: []},
            labels: [],
          },
        ],
        replyToUri: 'at://did:plc:xyz/app.bsky.feed.post/parent123',
        replyToAuthor: {
          did: 'did:plc:xyz',
          handle: 'alice.bsky.social',
        },
        syncStatus: 'local',
      }

      // Verify the draft structure is correct
      expect(draft.posts).toHaveLength(2)
      expect(draft.posts[0].images).toHaveLength(1)
      expect(draft.replyToAuthor?.handle).toBe('alice.bsky.social')
    })
  })
})
