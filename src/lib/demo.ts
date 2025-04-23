import {type AppBskyFeedGetFeed} from '@atproto/api'
import {subDays,subMinutes} from 'date-fns'

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
    /*
    {
      post: {
        uri: 'at://did:plc:5o6k7jvowuyaquloafzn3cfw/app.bsky.feed.post/3lng6lkuhxc2s',
        cid: 'bafyreifwapmjx76kz5lkoeejfoes4ct2xhyycfyxwccmyr3mtxht5juyli',
        author: {
          did: 'did:plc:5o6k7jvowuyaquloafzn3cfw',
          handle: 'johndoe.org',
          displayName: 'John Doe',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:5o6k7jvowuyaquloafzn3cfw/bafkreierrwtdsf5quwprs2xqmmh2lu2k7au2cibyegfpard6wqyjs7nd6i@jpeg',

          viewer: {
            muted: false,
            blockedBy: false,
            following:
              'at://did:plc:p2cp5gopk7mgjegy6wadk3ep/app.bsky.graph.follow/3kcvvfzq6o32a',
            followedBy:
              'at://did:plc:vwzwgnygau7ed7b7wt5ux7y2/app.bsky.graph.follow/3jwawchotz22h',
          },
          labels: [],
          createdAt: '2023-05-16T02:37:39.269Z',
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: '2025-04-22T17:15:53.178Z',
          langs: ['en'],
          text: "I'm running out of ideas for these fake posts. Alas, such is the demands of modern life. Do you like blueberries? Just remembered that blueberries are delicious! They're so tasty! I can't wait to try them!",
        },
        replyCount: 13,
        repostCount: 121,
        likeCount: 345,
        quoteCount: 6,
        indexedAt: '2025-04-22T17:15:53.351Z',
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
    },
    {
      post: {
        uri: 'at://did:plc:5ywatwbfxoecxgb4xq6ods72/app.bsky.feed.post/3lng5w2fbvs2g',
        cid: 'bafyreigi7d57fudzoybe4u6w7friw6ydz3pmzrdu3bvjwb5mvsvlprk23y',
        author: {
          did: 'did:plc:5ywatwbfxoecxgb4xq6ods72',
          handle: 'cooking.bsky.social',
          displayName: 'cooking tips',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:5ywatwbfxoecxgb4xq6ods72/bafkreibbsuyy25elibbys5vx25cnkcs6g4ih6dozypa4bomwhkwsi6f5wa@jpeg',

          viewer: {
            muted: false,
            blockedBy: false,
            following:
              'at://did:plc:p2cp5gopk7mgjegy6wadk3ep/app.bsky.graph.follow/3kcvvfzq6o32a',
            followedBy:
              'at://did:plc:vwzwgnygau7ed7b7wt5ux7y2/app.bsky.graph.follow/3jwawchotz22h',
          },
          labels: [],
          createdAt: '2024-05-28T00:18:08.531Z',
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: '2025-04-22T17:03:51.259Z',
          langs: ['en'],
          text: 'and another thing. I have more things to say. I think. I forget :/',
        },
        replyCount: 1,
        repostCount: 4,
        likeCount: 20,
        quoteCount: 0,
        indexedAt: '2025-04-22T17:03:52.050Z',
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
    },
    {
      post: {
        uri: 'at://did:plc:fpruhuo22xkm5o7ttr2ktxdo/app.bsky.feed.post/3lng5izl7kc2c',
        cid: 'bafyreicsich65s4rq526rek5jmvd6djtcmr7kdavw26rrnf424awgvia7i',
        author: {
          did: 'did:plc:fpruhuo22xkm5o7ttr2ktxdo',
          handle: 'danabra.mov',
          displayName: 'dan',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:fpruhuo22xkm5o7ttr2ktxdo/bafkreif43mhqajnbnl62u3ezf37g6x22nd762im54thxbil4ga46eugcga@jpeg',
          associated: {
            chat: {
              allowIncoming: 'all',
            },
          },
          viewer: {
            muted: false,
            blockedBy: false,
            following:
              'at://did:plc:p2cp5gopk7mgjegy6wadk3ep/app.bsky.graph.follow/3jtdzgbbysa2y',
            followedBy:
              'at://did:plc:fpruhuo22xkm5o7ttr2ktxdo/app.bsky.graph.follow/3k7ht6lwu6t2a',
          },
          labels: [],
          createdAt: '2023-04-08T20:19:22.589Z',
          verification: {
            verifications: [
              {
                issuer: 'did:plc:z72i7hdynmk6r22z27h6tvur',
                uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.graph.verification/3lndpxompy32z',
                isValid: true,
                createdAt: '2025-04-21T10:48:53.876Z',
              },
            ],
            verifiedStatus: 'valid',
            trustedVerifierStatus: 'none',
          },
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: '2025-04-22T16:56:34.198Z',
          langs: ['en'],
          text: 'maybe i should write something about vercel at some point',
        },
        replyCount: 10,
        repostCount: 1,
        likeCount: 84,
        quoteCount: 1,
        indexedAt: '2025-04-22T16:56:34.356Z',
        viewer: {
          threadMuted: false,
          replyDisabled: false,
          embeddingDisabled: false,
        },
        labels: [],
        threadgate: {
          uri: 'at://did:plc:fpruhuo22xkm5o7ttr2ktxdo/app.bsky.feed.threadgate/3lng5izl7kc2c',
          cid: 'bafyreic4wpsh5wrmjvbngt7som5436xzjhdnld3mxnkzyhj2i4vh6lpefa',
          record: {
            $type: 'app.bsky.feed.threadgate',
            allow: [
              {
                $type: 'app.bsky.feed.threadgate#followerRule',
              },
              {
                $type: 'app.bsky.feed.threadgate#followingRule',
              },
              {
                $type: 'app.bsky.feed.threadgate#mentionRule',
              },
            ],
            createdAt: '2025-04-22T16:56:34.200Z',
            hiddenReplies: [],
            post: 'at://did:plc:fpruhuo22xkm5o7ttr2ktxdo/app.bsky.feed.post/3lng5izl7kc2c',
          },
          lists: [],
        },
      },
    },
    {
      post: {
        uri: 'at://did:plc:77tdak46psveqneyegsdyc7l/app.bsky.feed.post/3lnft75ivlc27',
        cid: 'bafyreic24reeweaymcfe6hdsuhmffazdpa5hoqyculxrdp2sr7xkoehgay',
        author: {
          did: 'did:plc:77tdak46psveqneyegsdyc7l',
          handle: 'werd.io',
          displayName: 'Ben Werdmuller',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:77tdak46psveqneyegsdyc7l/bafkreicoqtayuefjlw73nrx4c7sioc3ujq74uisgbh4ddmuamevjwzt4fu@jpeg',
          associated: {
            chat: {
              allowIncoming: 'following',
            },
          },
          viewer: {
            muted: false,
            blockedBy: false,
          },
          labels: [],
          createdAt: '2023-03-07T15:40:54.229Z',
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: '2025-04-22T13:52:05.353Z',
          langs: ['en'],
          text: 'This is obvious, but if people broadly rely on a black box to give them answers that help them understand the world, whoever controls the black box controls those answers and therefore the understanding that comes from them.\n\nOpenness is safety.',
        },
        replyCount: 10,
        repostCount: 84,
        likeCount: 432,
        quoteCount: 2,
        indexedAt: '2025-04-22T13:52:05.755Z',
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
    },
    */
  ],
} satisfies AppBskyFeedGetFeed.OutputSchema

export const BOTTOM_BAR_AVI = 'https://bsky.social/about/hero-social-card.webp'
