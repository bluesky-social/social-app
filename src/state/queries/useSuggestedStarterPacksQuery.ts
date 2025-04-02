import {useQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

export const createSuggestedStarterPacksQueryKey = () => [
  'suggested-starter-packs',
]

export function useSuggestedStarterPacksQuery() {
  const agent = useAgent()

  return useQuery({
    queryKey: createSuggestedStarterPacksQueryKey(),
    async queryFn() {
      // TODO interests
      const {data} = await agent.app.bsky.unspecced.getSuggestedStarterPacks()
      return data
    },
  })
}
