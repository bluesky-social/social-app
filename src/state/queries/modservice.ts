import {useQuery} from '@tanstack/react-query'
import {getAgent} from '../session'

export const RQKEY = (did: string) => ['mod-service-info', did]

export function useModServiceInfoQuery({did}: {did: string}) {
  return useQuery({
    queryKey: RQKEY(did),
    queryFn: async () => {
      const res = await getAgent().app.bsky.moderation.getService({did})
      return res.data
    },
  })
}
