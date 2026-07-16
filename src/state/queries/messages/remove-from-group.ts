import {type DidString} from '@atproto/syntax'
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {RQKEY as CONVO_KEY} from './conversation'
import {RQKEY_ROOT as CONVO_LIST_KEY} from './list-conversations'
import {listConvoMembersQueryKey} from './list-convo-members'

export function useRemoveFromGroupChat(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: chat.bsky.group.removeMembers.$OutputBody) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const chatClient = useChatClient()

  return useMutation({
    mutationFn: async ({members}: {members: string[]}) => {
      if (!convoId) throw new Error('No convoId provided')
      const data = await chatClient.call(chat.bsky.group.removeMembers, {
        convoId,
        members: members as DidString[],
      })
      return data
    },
    onMutate: ({members}) => {
      if (!convoId) return

      const prevConvo =
        queryClient.getQueryData<chat.bsky.convo.defs.ConvoView>(
          CONVO_KEY(convoId),
        )
      const prevListEntries = queryClient.getQueriesData<
        InfiniteData<chat.bsky.convo.listConvos.$OutputBody>
      >({queryKey: [CONVO_LIST_KEY]})
      const prevMemberList = queryClient.getQueryData<
        chat.bsky.actor.defs.ProfileViewBasic[]
      >(listConvoMembersQueryKey(convoId))

      queryClient.setQueryData<chat.bsky.convo.defs.ConvoView>(
        CONVO_KEY(convoId),
        prev => {
          if (!prev) return
          const nextMembers = prev.members.filter(m => !members.includes(m.did))
          const removed = prev.members.length - nextMembers.length
          if (!bsky.isType(chat.bsky.convo.defs.groupConvo, prev.kind)) {
            return {...prev, members: nextMembers}
          }
          return {
            ...prev,
            members: nextMembers,
            kind: {
              ...prev.kind,
              memberCount: Math.max(0, prev.kind.memberCount - removed),
            },
          }
        },
      )

      queryClient.setQueriesData<
        InfiniteData<chat.bsky.convo.listConvos.$OutputBody>
      >({queryKey: [CONVO_LIST_KEY]}, prev => {
        if (!prev?.pages) return
        return {
          ...prev,
          pages: prev.pages.map(page => ({
            ...page,
            convos: page.convos.map(convo => {
              if (convo.id !== convoId) return convo
              const nextMembers = convo.members.filter(
                m => !members.includes(m.did),
              )
              const removed = convo.members.length - nextMembers.length
              if (!bsky.isType(chat.bsky.convo.defs.groupConvo, convo.kind)) {
                return {...convo, members: nextMembers}
              }
              return {
                ...convo,
                members: nextMembers,
                kind: {
                  ...convo.kind,
                  memberCount: Math.max(0, convo.kind.memberCount - removed),
                },
              }
            }),
          })),
        }
      })

      queryClient.setQueryData<chat.bsky.actor.defs.ProfileViewBasic[]>(
        listConvoMembersQueryKey(convoId),
        prev => {
          if (!prev) return
          return prev.filter(m => !members.includes(m.did))
        },
      )

      return {prevConvo, prevListEntries, prevMemberList}
    },
    onSuccess: data => {
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
      if (context?.prevMemberList && convoId) {
        queryClient.setQueryData(
          listConvoMembersQueryKey(convoId),
          context.prevMemberList,
        )
      }
      onError?.(e)
    },
  })
}
