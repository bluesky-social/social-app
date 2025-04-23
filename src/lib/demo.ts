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
        uri: 'at://did:plc:pvooorihapc2lf2pijehgrdf/app.bsky.feed.post/3lniysofyll2d',
        cid: 'bafyreihwh3wxxme732ylbylhhdyz7ex6t4jtu6s3gjxxvnnh4feddhg3ku',
        author: {
          did: 'did:plc:pvooorihapc2lf2pijehgrdf',
          handle: 'forkedriverband.bsky.social',
          displayName: 'Forked River Band',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:pvooorihapc2lf2pijehgrdf/bafkreiarkmzr3wa6ty75qigkkbvtgbler2yiqgfdrupmimy4whcnesu4d4@jpeg',
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
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: POST_1_DATE,
          // embed: {
          //   $type: 'app.bsky.embed.images',
          //   images: [
          //     {
          //       alt: 'Fake flier for Sebastapol Bluegrass Fest',
          //       aspectRatio: {
          //         height: 1350,
          //         width: 900,
          //       },
          //       image: {
          //         $type: 'blob',
          //         ref: {
          //           $link:
          //             'bafkreig7gnirmz5guhhjutf3mqbjjzxzi3w4wvs5qy2gnxma5g3brbaidi',
          //         },
          //         mimeType: 'image/jpeg',
          //         size: 562871,
          //       },
          //     },
          //   ],
          // },
          langs: ['en'],
          text: 'Sonoma County folks: Come tip your hats our way and see us play new and old tunes at Sebastopol Bluegrass Fest on June 14th.',
        },
        embed: {
          $type: 'app.bsky.embed.images#view',
          images: [
            {
              thumb:
                'https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:pvooorihapc2lf2pijehgrdf/bafkreig7gnirmz5guhhjutf3mqbjjzxzi3w4wvs5qy2gnxma5g3brbaidi@jpeg',
              fullsize:
                'https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:pvooorihapc2lf2pijehgrdf/bafkreig7gnirmz5guhhjutf3mqbjjzxzi3w4wvs5qy2gnxma5g3brbaidi@jpeg',
              alt: 'Fake flier for Sebastapol Bluegrass Fest',
              aspectRatio: {
                height: 1350,
                width: 900,
              },
            },
          ],
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
        uri: 'at://did:plc:fhhqii56ppgyh5qcm2b3mokf/app.bsky.feed.post/3lnizc7fug52c',
        cid: 'bafyreienuabsr55rycirdf4ewue5tjcseg5lzqompcsh2brqzag6hvxllm',
        author: {
          did: 'did:plc:fhhqii56ppgyh5qcm2b3mokf',
          handle: 'dinh-designs.bsky.social',
          displayName: 'Dinh Designs',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:fhhqii56ppgyh5qcm2b3mokf/bafkreidou2xiwmwgq4rz7jj3myyhtvvcd47v5rrmj5xpp5w3nst6tmeoxi@jpeg',
          viewer: {
            muted: false,
            blockedBy: false,
            following: `at://${DID}/app.bsky.graph.follow/post2`,
          },
          labels: [],
          createdAt: POST_2_DATE,
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: POST_2_DATE,
          // embed: {
          //   $type: 'app.bsky.embed.images',
          //   images: [
          //     {
          //       alt: 'Placeholder image of interior design',
          //       aspectRatio: {
          //         height: 872,
          //         width: 598,
          //       },
          //       image: {
          //         $type: 'blob',
          //         ref: {
          //           $link:
          //             'bafkreidcjc6bjb4jjjejruin5cldhj5zovsuu4tydulenyprneziq5rfeu',
          //         },
          //         mimeType: 'image/jpeg',
          //         size: 296003,
          //       },
          //     },
          //   ],
          // },
          langs: ['en'],
          text: 'Details from our install at the Lucas residence in Joshua Tree. We populated the space with rich, earthy tones and locally-sourced materials to suit the landscape.',
        },
        embed: {
          $type: 'app.bsky.embed.images#view',
          images: [
            {
              thumb:
                'https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:fhhqii56ppgyh5qcm2b3mokf/bafkreidcjc6bjb4jjjejruin5cldhj5zovsuu4tydulenyprneziq5rfeu@jpeg',
              fullsize:
                'https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:fhhqii56ppgyh5qcm2b3mokf/bafkreidcjc6bjb4jjjejruin5cldhj5zovsuu4tydulenyprneziq5rfeu@jpeg',
              alt: 'Placeholder image of interior design',
              aspectRatio: {
                height: 872,
                width: 598,
              },
            },
          ],
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
        uri: 'at://did:plc:h7fwnfejmmifveeea5eyxgkc/app.bsky.feed.post/3lnizna3g4f2t',
        cid: 'bafyreiepn7obmlshliori4j34texpaukrqkyyu7cq6nmpzk4lkis7nqeae',
        author: {
          did: 'did:plc:h7fwnfejmmifveeea5eyxgkc',
          handle: 'visionprofan.bsky.social',
          displayName: 'Sammy',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:h7fwnfejmmifveeea5eyxgkc/bafkreia4fxcfoiny44sc5nujs7fpqxcxustuzepovxpsrq3e5cibcmscz4@jpeg',
          viewer: {
            muted: false,
            blockedBy: false,
            following: `at://${DID}/app.bsky.graph.follow/post3`,
          },
          labels: [],
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
        quoteCount: 0,
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
  'https://cdn.bsky.app/img/avatar/plain/did:plc:p2cp5gopk7mgjegy6wadk3ep/bafkreiaqsy36o6lpbpnonb4n46cvntfs6zoxbav35raix2sxhqgopxcjge@jpeg'
