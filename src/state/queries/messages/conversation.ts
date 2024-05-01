import {BskyAgent} from '@atproto-labs/api'
import {useQuery} from '@tanstack/react-query'

import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'
import {useHeaders} from './temp-headers'

const RQKEY_ROOT = 'convo'
export const RQKEY = (convoId: string) => [RQKEY_ROOT, convoId]

export function useConvoQuery(convoId: string) {
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()

  return useQuery({
    queryKey: RQKEY(convoId),
    queryFn: async () => {
      const agent = new BskyAgent({service: serviceUrl})
      const {data} = await agent.api.chat.bsky.convo.getConvo(
        {convoId},
        {headers},
      )
      return data.convo
    },
  })
}
