import {
  type ChatBskyConvoGetConvoMembers,
  type ChatBskyGroupApproveJoinRequest,
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
import {listConvoMembersQueryKey} from './list-convo-members'
import {createListJoinRequestsQueryKey} from './list-join-requests'

type JoinRequestAction = 'approve' | 'reject'

type JoinRequestOutput<A extends JoinRequestAction> = A extends 'approve'
  ? ChatBskyGroupApproveJoinRequest.OutputSchema
  : ChatBskyGroupRejectJoinRequest.OutputSchema

export function useJoinRequestMutation<A extends JoinRequestAction>(
  action: A,
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: JoinRequestOutput<A>) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({member}: {member: string}) => {
      if (!convoId) throw new Error('No convoId provided')
      const endpoint =
        action === 'approve'
          ? agent.chat.bsky.group.approveJoinRequest
          : agent.chat.bsky.group.rejectJoinRequest
      const {data} = await endpoint(
        {convoId, member},
        {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
      )
      return data as JoinRequestOutput<A>
    },
    onMutate: ({member}) => {
      if (!convoId) return

      const requestsKey = createListJoinRequestsQueryKey({convoId})
      const prevRequests =
        queryClient.getQueryData<
          InfiniteData<ChatBskyGroupListJoinRequests.OutputSchema>
        >(requestsKey)

      const requestedByProfile = prevRequests?.pages
        .flatMap(page => page.requests)
        .find(request => request.requestedBy.did === member)?.requestedBy

      queryClient.setQueryData<
        InfiniteData<ChatBskyGroupListJoinRequests.OutputSchema>
      >(requestsKey, prev => {
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

      let prevMembers:
        | InfiniteData<ChatBskyConvoGetConvoMembers.OutputSchema>
        | undefined
      if (action === 'approve' && requestedByProfile) {
        const membersKey = listConvoMembersQueryKey(convoId)
        prevMembers =
          queryClient.getQueryData<
            InfiniteData<ChatBskyConvoGetConvoMembers.OutputSchema>
          >(membersKey)
        queryClient.setQueryData<
          InfiniteData<ChatBskyConvoGetConvoMembers.OutputSchema>
        >(membersKey, prev => {
          if (!prev?.pages) return prev
          if (prev.pages.some(page => page.members.some(m => m.did === member)))
            return prev
          const pages = prev.pages.map((page, i) =>
            i === prev.pages.length - 1
              ? {...page, members: [...page.members, requestedByProfile]}
              : page,
          )
          return {...prev, pages}
        })
      }

      return {prevRequests, prevMembers}
    },
    onSuccess: data => {
      if (convoId) {
        void queryClient.invalidateQueries({
          queryKey: createListJoinRequestsQueryKey({convoId}),
        })
        if (action === 'approve') {
          void queryClient.invalidateQueries({
            queryKey: listConvoMembersQueryKey(convoId),
          })
        }
      }
      onSuccess?.(data)
    },
    onError: (error, _variables, context) => {
      logger.error(error)
      if (convoId && context?.prevRequests) {
        queryClient.setQueryData(
          createListJoinRequestsQueryKey({convoId}),
          context.prevRequests,
        )
      }
      if (convoId && action === 'approve' && context?.prevMembers) {
        queryClient.setQueryData(
          listConvoMembersQueryKey(convoId),
          context.prevMembers,
        )
      }
      onError?.(error)
    },
  })
}
