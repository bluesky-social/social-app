import {BskyAgent} from '@atproto-labs/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useOnMarkAsRead} from '#/state/queries/messages/list-converations'
import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'
import {RQKEY as LIST_CONVOS_KEY} from './list-converations'
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

export function useMarkAsReadMutation() {
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()
  const optimisticUpdate = useOnMarkAsRead()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      convoId,
      messageId,
    }: {
      convoId: string
      messageId?: string
    }) => {
      const agent = new BskyAgent({service: serviceUrl})
      await agent.api.chat.bsky.convo.updateRead(
        {
          convoId,
          messageId,
        },
        {
          encoding: 'application/json',
          headers,
        },
      )
    },
    onMutate({convoId}) {
      optimisticUpdate(convoId)
    },
    onSettled() {
      queryClient.invalidateQueries({queryKey: LIST_CONVOS_KEY})
    },
  })
}
