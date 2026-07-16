import {type DidString} from '@atproto/syntax'
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import {listConvoMembersQueryKey} from './list-convo-members'
import {createListJoinRequestsQueryKey} from './list-join-requests'

type JoinRequestAction = 'approve' | 'reject'

type JoinRequestOutput<A extends JoinRequestAction> = A extends 'approve'
  ? chat.bsky.group.approveJoinRequest.$OutputBody
  : chat.bsky.group.rejectJoinRequest.$OutputBody

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
  const chatClient = useChatClient()

  return useMutation({
    mutationFn: async ({member}: {member: string}) => {
      if (!convoId) throw new Error('No convoId provided')
      const data =
        action === 'approve'
          ? await chatClient.call(chat.bsky.group.approveJoinRequest, {
              convoId,
              member: member as DidString,
            })
          : await chatClient.call(chat.bsky.group.rejectJoinRequest, {
              convoId,
              member: member as DidString,
            })
      return data as JoinRequestOutput<A>
    },
    onMutate: ({member}) => {
      if (!convoId) return

      const requestsKey = createListJoinRequestsQueryKey({convoId})
      const prevRequests =
        queryClient.getQueryData<
          InfiniteData<chat.bsky.group.listJoinRequests.$OutputBody>
        >(requestsKey)

      const requestedByProfile = prevRequests?.pages
        .flatMap(page => page.requests)
        .find(request => request.requestedBy.did === member)?.requestedBy

      queryClient.setQueryData<
        InfiniteData<chat.bsky.group.listJoinRequests.$OutputBody>
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

      let prevMembers: chat.bsky.actor.defs.ProfileViewBasic[] | undefined
      if (action === 'approve' && requestedByProfile) {
        const membersKey = listConvoMembersQueryKey(convoId)
        prevMembers =
          queryClient.getQueryData<chat.bsky.actor.defs.ProfileViewBasic[]>(
            membersKey,
          )
        queryClient.setQueryData<chat.bsky.actor.defs.ProfileViewBasic[]>(
          membersKey,
          prev => {
            if (!prev) return prev
            if (prev.some(m => m.did === member)) return prev
            return [...prev, requestedByProfile]
          },
        )
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
