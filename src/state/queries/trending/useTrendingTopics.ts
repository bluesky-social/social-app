import {useQuery} from '@tanstack/react-query'

// TEMP
import {makeSearchLink} from '#/lib/routes/links'

export type TrendingTopic = {
  topic: string
  displayName: string
  description: string
  link: string
}

export const trendingTopicsQueryKey = ['trending-topics']

// TODO ideally handle down-state faster

export function useTrendingTopics() {
  return useQuery({
    queryKey: trendingTopicsQueryKey,
    async queryFn() {
      const topics: TrendingTopic[] = [
        {
          topic: '#atproto',
          displayName: '#atproto',
          description: '',
          link: '/hashtag/atproto',
        },
        {
          topic: 'South Korea',
          displayName: 'South Korea',
          description: '',
          link: makeSearchLink({query: 'South Korea'}),
        },
        {
          topic: 'Paul Frazee',
          displayName: 'Paul Frazee',
          description: '',
          link: 'at://did:plc:ragtjsm2j2vknwkz3zp4oxrd/app.bsky.actor.profile/self',
        },
        {
          topic: 'Wired',
          displayName: 'Wired',
          description: '',
          link: makeSearchLink({query: 'Wired'}),
        },
        {
          topic: 'Quiet Posters',
          displayName: 'Quiet Posters',
          description: '',
          link: 'at://did:plc:vpkhqolt662uhesyj6nxm7ys/app.bsky.feed.generator/infreq',
        },
      ]
      return topics
    },
  })
}
