import {
  type ChatBskyGroupListJoinRequests,
  type ChatBskyGroupRejectJoinRequest,
} from '@atproto/api'
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {createListJoinRequestsQueryKey} from './list-join-requests'

export function useRejectJoinRequest(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyGroupRejectJoinRequest.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({member}: {member: string}) => {
      if (!convoId) throw new Error('No convoId provided')
      const {data} = await agent.chat.bsky.group.rejectJoinRequest(
        {convoId, member},
        {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
      )
      return data
    },
    onMutate: ({member}) => {
      if (!convoId) return

      const queryKey = createListJoinRequestsQueryKey({convoId})
      const prevData =
        queryClient.getQueryData<
          InfiniteData<ChatBskyGroupListJoinRequests.OutputSchema>
        >(queryKey)

      queryClient.setQueryData<
        InfiniteData<ChatBskyGroupListJoinRequests.OutputSchema>
      >(queryKey, prev => {
        if (!prev?.pages) return prev
        return {
          ...prev,
          pages: prev.pages.map(page => ({
            ...page,
            requests: page.requests.filter(
              request => request.requestedBy.did !== member,
            ),
          })),
        }
      })

      return {prevData}
    },
    onSuccess: data => {
      if (convoId) {
        void queryClient.invalidateQueries({
          queryKey: createListJoinRequestsQueryKey({convoId}),
        })
      }
      onSuccess?.(data)
    },
    onError: (error, _variables, context) => {
      logger.error(error)
      if (convoId && context?.prevData) {
        queryClient.setQueryData(
          createListJoinRequestsQueryKey({convoId}),
          context.prevData,
        )
      }
      onError?.(error)
    },
  })
}
