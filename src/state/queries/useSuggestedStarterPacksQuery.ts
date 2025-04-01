import {useQuery} from '@tanstack/react-query'
import {AppBskyGraphDefs} from '@atproto/api'

import {useAgent} from '#/state/session'

export const createSuggestedStarterPacksQueryKey = () => [
  'suggested-starter-packs',
]

export function useSuggestedStarterPacksQuery() {
  const agent = useAgent()

  return useQuery({
    queryKey: createSuggestedStarterPacksQueryKey(),
    async queryFn() {
      // // @ts-expect-error
      // const {data} = await agent.app.bsky.unspecced.getSuggestedStarterPacks()
      // const {starterPacks} = data
      const {starterPacks} = {starterPacks: [temp]}
      return starterPacks as AppBskyGraphDefs.StarterPackViewBasic[]
    },
  })
}

const temp = {
  uri: 'at://did:plc:dpajgwmnecpdyjyqzjzm6bnb/app.bsky.graph.starterpack/3l3bhtqkjfo2m',
  cid: 'bafyreifvtjkrvuq3qcyz32p6lacdxbwhcmux5amnhokfputfarlpuyqqhu',
  record: {
    $type: 'app.bsky.graph.starterpack',
    createdAt: '2024-09-03T18:44:43.158Z',
    feeds: [
      {
        avatar:
          'https://cdn.bsky.app/img/avatar/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreieppnjpayqgjbyqnbeqzwj3pzqtiwbe5a4m6whzqnp3k7gpqs2gai@jpeg',
        cid: 'bafyreigreonzn577vy6i4qh2so7aqfjztqrrj4jpssg2jczc27p6x4y6wi',
        creator: {
          associated: {
            chat: {
              allowIncoming: 'none',
            },
          },
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreihagr2cmvl2jt4mgx3sppwe2it3fwolkrbtjrhcnwjk4jdijhsoze@jpeg',
          createdAt: '2023-04-12T04:53:57.057Z',
          description:
            'official Bluesky account (check username👆)\n\nBugs, feature requests, feedback: support@bsky.app',
          did: 'did:plc:z72i7hdynmk6r22z27h6tvur',
          displayName: 'Bluesky',
          handle: 'bsky.app',
          indexedAt: '2024-12-18T07:43:57.513Z',
          labels: [
            {
              cts: '2024-05-31T04:01:47.907Z',
              src: 'did:plc:z3yk2cflhmn6vmzo3f5ixqh4',
              uri: 'did:plc:z72i7hdynmk6r22z27h6tvur',
              val: 'cornerstone',
              ver: 1,
            },
          ],
          viewer: {
            blockedBy: false,
            muted: false,
          },
        },
        description:
          'A mix of popular content from accounts you follow and content that your follows like.',
        did: 'did:web:discover.bsky.app',
        displayName: 'Popular With Friends',
        indexedAt: '2023-05-19T23:19:21.076Z',
        labels: [],
        likeCount: 33616,
        uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-friends',
        viewer: {},
      },
    ],
    list: 'at://did:plc:dpajgwmnecpdyjyqzjzm6bnb/app.bsky.graph.list/3l3bhtqgyrn2e',
    name: "Tom Sawyeeeeeee's Starter Pack",
    updatedAt: '2024-12-19T22:44:58.411Z',
  },
  creator: {
    did: 'did:plc:dpajgwmnecpdyjyqzjzm6bnb',
    handle: 'test.esb.lol',
    displayName: 'e',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:dpajgwmnecpdyjyqzjzm6bnb/bafkreia6dx7fhoi6fxwfpgm7jrxijpqci7ap53wpilkpazojwvqlmgud2m@jpeg',
    associated: {
      chat: {
        allowIncoming: 'all',
      },
    },
    viewer: {
      muted: false,
      blockedBy: false,
    },
    labels: [],
    createdAt: '2023-07-17T15:57:52.014Z',
  },
  joinedAllTimeCount: 1,
  joinedWeekCount: 0,
  labels: [],
  indexedAt: '2024-12-19T22:45:06.322Z',
}
