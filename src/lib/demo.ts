import {type AppBskyFeedGetFeed} from '@atproto/api'
import {subDays, subMinutes} from 'date-fns'

const DID = `did:plc:z72i7hdynmk6r22z27h6tvur`
const NOW = new Date()
const POST_1_DATE = subMinutes(NOW, 2).toISOString()
const POST_2_DATE = subMinutes(NOW, 4).toISOString()
const POST_3_DATE = subMinutes(NOW, 5).toISOString()

export const DEMO_FEED = {
  feed: [
    {
      post: {
        uri: `at://${DID}/app.bsky.feed.post/post1`,
        cid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        author: {
          did: DID,
          handle: 'forkedriver.blsky',
          displayName: 'Forked River Band',
          avatar: 'https://bsky.social/about/adi/post_1_avi.jpg',
          associated: {
            chat: {
              allowIncoming: 'following',
            },
          },
          viewer: {
            muted: false,
            blockedBy: false,
            following: `at://${DID}/app.bsky.graph.follow/post1`,
          },
          labels: [],
          createdAt: POST_1_DATE,
          verification: {
            verifications: [
              {
                issuer: DID,
                uri: `at://${DID}/app.bsky.graph.verification/post1`,
                isValid: true,
                createdAt: subDays(NOW, 11).toISOString(),
              },
            ],
            verifiedStatus: 'valid',
            trustedVerifierStatus: 'none',
          },
        },
        embed: {
          $type: 'app.bsky.embed.images#view',
          images: [
            {
              thumb: 'https://bsky.social/about/adi/post_1_image.jpg',
              fullsize: 'https://bsky.social/about/adi/post_1_image.jpg',
              alt: '',
              aspectRatio: {
                height: 1350,
                width: 900,
              },
            },
          ],
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: POST_1_DATE,
          langs: ['en'],
          text: 'Sonoma County folks: Come tip your hats our way and see us play new and old tunes at Sebastopol Bluegrass Fest on June 14th.',
        },
        replyCount: 1,
        repostCount: 4,
        likeCount: 18,
        quoteCount: 0,
        indexedAt: POST_1_DATE,
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
    },
    {
      post: {
        uri: `at://${DID}/app.bsky.feed.post/post2`,
        cid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        author: {
          did: DID,
          handle: 'dinh-designs.blsky',
          displayName: 'Dinh Designs',
          avatar: 'https://bsky.social/about/adi/post_2_avi.jpg',
          associated: {
            chat: {
              allowIncoming: 'following',
            },
          },
          viewer: {
            muted: false,
            blockedBy: false,
            following: `at://${DID}/app.bsky.graph.follow/post2`,
          },
          labels: [],
          createdAt: POST_2_DATE,
        },
        embed: {
          $type: 'app.bsky.embed.images#view',
          images: [
            {
              thumb: 'https://bsky.social/about/adi/post_2_image.jpg',
              fullsize: 'https://bsky.social/about/adi/post_2_image.jpg',
              alt: '',
              aspectRatio: {
                height: 872,
                width: 598,
              },
            },
          ],
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: POST_2_DATE,
          langs: ['en'],
          text: 'Details from our install at the Lucas residence in Joshua Tree. We populated the space with rich, earthy tones and locally-sourced materials to suit the landscape.',
        },
        replyCount: 3,
        repostCount: 1,
        likeCount: 4,
        quoteCount: 0,
        indexedAt: POST_2_DATE,
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
    },
    {
      post: {
        uri: `at://${DID}/app.bsky.feed.post/post3`,
        cid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        author: {
          did: DID,
          handle: 'visionprofan.blsky',
          displayName: 'Visionary',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:p2cp5gopk7mgjegy6wadk3ep/bafkreiaqsy36o6lpbpnonb4n46cvntfs6zoxbav35raix2sxhqgopxcjge@jpeg',
          associated: {
            chat: {
              allowIncoming: 'following',
            },
          },
          viewer: {
            muted: false,
            blockedBy: false,
            following: `at://${DID}/app.bsky.graph.follow/post3`,
          },
          createdAt: POST_3_DATE,
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: POST_3_DATE,
          langs: ['en'],
          text: 'Just got my Vision Pro! 🤯\n\nAny recommendations for apps to try out?',
        },
        replyCount: 11,
        repostCount: 97,
        likeCount: 399,
        quoteCount: 3,
        indexedAt: POST_3_DATE,
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
    },
  ],
} satisfies AppBskyFeedGetFeed.OutputSchema

export const BOTTOM_BAR_AVI =
  'https://cdn.bsky.app/img/avatar/plain/did:plc:3jpt2mvvsumj2r7eqk4gzzjz/bafkreibrhptgequemf4anrjxgbf5lpgo6szvjobjcxyvt76ui7jtvebrfa@jpeg'
