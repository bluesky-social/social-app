import {BskyAgent, ChatBskyConvoGetConvoForMembers} from '@atproto-labs/api'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {useSession} from '#/state/session'
import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'
import * as TempDmChatDefs from '#/temp/dm/defs'
import * as TempDmChatGetChatLog from '#/temp/dm/getChatLog'
import * as TempDmChatGetChatMessages from '#/temp/dm/getChatMessages'

export const useHeaders = () => {
  const {currentAccount} = useSession()
  return {
    get Authorization() {
      return currentAccount!.did
    },
  }
}

type Chat = {
  chatId: string
  messages: TempDmChatGetChatMessages.OutputSchema['messages']
  lastCursor?: string
  lastRev?: string
}

export function useChatLogQuery() {
  const queryClient = useQueryClient()
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()

  return useQuery({
    queryKey: ['chatLog'],
    queryFn: async () => {
      const prevLog = queryClient.getQueryData([
        'chatLog',
      ]) as TempDmChatGetChatLog.OutputSchema

      try {
        const response = await fetch(
          `${serviceUrl}/xrpc/temp.dm.getChatLog?cursor=${
            prevLog?.cursor ?? ''
          }`,
          {
            headers,
          },
        )

        if (!response.ok) throw new Error('Failed to fetch chat log')

        const json =
          (await response.json()) as TempDmChatGetChatLog.OutputSchema

        if (json.logs.length > 0) {
          queryClient.invalidateQueries({queryKey: ['chats']})
        }

        for (const log of json.logs) {
          if (TempDmChatDefs.isLogCreateMessage(log)) {
            queryClient.setQueryData(['chat', log.chatId], (prev: Chat) => {
              // TODO hack filter out duplicates
              if (prev?.messages.find(m => m.id === log.message.id)) return

              return {
                ...prev,
                messages: [log.message, ...prev.messages],
              }
            })
          }
        }

        return json
      } catch (e) {
        console.log(e)
      }
    },
    refetchInterval: 5000,
  })
}

export function useGetConvoForMembers({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: ChatBskyConvoGetConvoForMembers.OutputSchema) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()

  return useMutation({
    mutationFn: async (members: string[]) => {
      const agent = new BskyAgent({service: serviceUrl})
      const {data} = await agent.api.chat.bsky.convo.getConvoForMembers(
        {members: members},
        {headers},
      )

      return data
    },
    onSuccess: data => {
      queryClient.setQueryData(['chat', data.convo.id], {
        chatId: data.convo.id,
        messages: [],
        lastRev: data.convo.rev,
      })
      onSuccess?.(data)
    },
    onError,
  })
}

export function useListConvos() {
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()

  return useInfiniteQuery({
    queryKey: ['chats'],
    queryFn: async ({pageParam}) => {
      const agent = new BskyAgent({service: serviceUrl})
      const {data} = await agent.api.chat.bsky.convo.listConvos(
        {cursor: pageParam},
        {headers},
      )

      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}
