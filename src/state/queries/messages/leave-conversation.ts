import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {invalidateJoinLinkPreviewsForConvo} from '#/state/queries/join-links'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import {
  type ConvoRequestListQueryData,
  optimisticDelete as optimisticDeleteRequest,
  RQKEY_ROOT as REQUESTS_RQKEY_ROOT,
} from './list-conversation-requests'
import {RQKEY_ROOT as CONVO_LIST_KEY} from './list-conversations'

const RQKEY_ROOT = 'leave-convo'
export function RQKEY(convoId: string | undefined) {
  return [RQKEY_ROOT, convoId]
}

type ConvoListQueryData = {
  pageParams: Array<string | undefined>
  pages: Array<chat.bsky.convo.listConvos.$OutputBody>
}

export function useLeaveConvo(
  convoId: string | undefined,
  {
    onSuccess,
    onMutate,
    onError,
  }: {
    onMutate?: () => void
    onSuccess?: (data: chat.bsky.convo.leaveConvo.$OutputBody) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const chatClient = useChatClient()

  return useMutation({
    mutationKey: RQKEY(convoId),
    mutationFn: async () => {
      if (!convoId) throw new Error('No convoId provided')

      const data = await chatClient.call(chat.bsky.convo.leaveConvo, {convoId})

      return data
    },
    onMutate: () => {
      const prevConvoListQueries =
        queryClient.getQueriesData<ConvoListQueryData>({
          queryKey: [CONVO_LIST_KEY],
        })
      queryClient.setQueriesData<ConvoListQueryData>(
        {queryKey: [CONVO_LIST_KEY]},
        old => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              convos: page.convos.filter(convo => convo.id !== convoId),
            })),
          }
        },
      )
      const prevRequestsQueries =
        queryClient.getQueriesData<ConvoRequestListQueryData>({
          queryKey: [REQUESTS_RQKEY_ROOT],
        })
      queryClient.setQueriesData<ConvoRequestListQueryData>(
        {queryKey: [REQUESTS_RQKEY_ROOT]},
        old => (convoId ? optimisticDeleteRequest(convoId, old) : old),
      )
      onMutate?.()
      return {prevConvoListQueries, prevRequestsQueries}
    },
    onSuccess: data => {
      void queryClient.invalidateQueries({queryKey: [CONVO_LIST_KEY]})
      void queryClient.invalidateQueries({queryKey: [REQUESTS_RQKEY_ROOT]})
      if (convoId) {
        void invalidateJoinLinkPreviewsForConvo(queryClient, convoId)
      }
      onSuccess?.(data)
    },
    onError: (error, _, context) => {
      logger.error(error)
      if (context?.prevConvoListQueries) {
        for (const [queryKey, prevData] of context.prevConvoListQueries) {
          queryClient.setQueryData(queryKey, prevData)
        }
      }
      if (context?.prevRequestsQueries) {
        for (const [queryKey, prevData] of context.prevRequestsQueries) {
          queryClient.setQueryData(queryKey, prevData)
        }
      }
      void queryClient.invalidateQueries({queryKey: [CONVO_LIST_KEY]})
      void queryClient.invalidateQueries({queryKey: [REQUESTS_RQKEY_ROOT]})
      onError?.(error)
    },
  })
}
