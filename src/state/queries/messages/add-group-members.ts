import {
  type ChatBskyConvoDefs,
  type ChatBskyConvoListConvos,
  type ChatBskyGroupAddMembers,
} from '@atproto/api'
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {RQKEY as CONVO_KEY} from './conversation'
import {RQKEY_ROOT as CONVO_LIST_KEY} from './list-conversations'

export function useAddGroupMembers(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyGroupAddMembers.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({members}: {members: string[]}) => {
      if (!convoId) throw new Error('No convoId provided')
      const {data} = await agent.chat.bsky.group.addMembers(
        {convoId, members},
        {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
      )
      return data
    },
    onMutate: () => {
      if (!convoId) return

      const prevConvo = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(
        CONVO_KEY(convoId),
      )
      const prevListEntries = queryClient.getQueriesData<
        InfiniteData<ChatBskyConvoListConvos.OutputSchema>
      >({queryKey: [CONVO_LIST_KEY]})

      return {prevConvo, prevListEntries}
    },
    onSuccess: data => {
      if (convoId) {
        queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(
          CONVO_KEY(convoId),
          data.convo,
        )

        queryClient.setQueriesData<
          InfiniteData<ChatBskyConvoListConvos.OutputSchema>
        >({queryKey: [CONVO_LIST_KEY]}, prev => {
          if (!prev?.pages) return
          return {
            ...prev,
            pages: prev.pages.map(page => ({
              ...page,
              convos: page.convos.map(convo =>
                convo.id === convoId ? data.convo : convo,
              ),
            })),
          }
        })
      }
      onSuccess?.(data)
    },
    onError: (e, _variables, context) => {
      logger.error(e)
      if (context?.prevConvo && convoId) {
        queryClient.setQueryData(CONVO_KEY(convoId), context.prevConvo)
      }
      if (context?.prevListEntries) {
        for (const [key, data] of context.prevListEntries) {
          queryClient.setQueryData(key, data)
        }
      }
      onError?.(e)
    },
  })
}
