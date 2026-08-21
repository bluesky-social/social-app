import {type DidString} from '@atproto/syntax'
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient} from '#/state/session'
import type * as ChatBskyActorDefs from '#/lexicons/chat/bsky/actor/defs'
import * as ChatBskyConvoDefs from '#/lexicons/chat/bsky/convo/defs'
import type * as ChatBskyConvoListConvos from '#/lexicons/chat/bsky/convo/listConvos'
import * as ChatBskyGroupRemoveMembers from '#/lexicons/chat/bsky/group/removeMembers'
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
    onSuccess?: (data: ChatBskyGroupRemoveMembers.$OutputBody) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const client = useChatClient()

  return useMutation({
    mutationFn: async ({members}: {members: string[]}) => {
      if (!convoId) throw new Error('No convoId provided')
      return await client.call(ChatBskyGroupRemoveMembers, {
        convoId,
        // callers pass already-resolved actor dids
        members: members as DidString[],
      })
    },
    onMutate: ({members}) => {
      if (!convoId) return

      const prevConvo = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(
        CONVO_KEY(convoId),
      )
      const prevListEntries = queryClient.getQueriesData<
        InfiniteData<ChatBskyConvoListConvos.$OutputBody>
      >({queryKey: [CONVO_LIST_KEY]})
      const prevMemberList = queryClient.getQueryData<
        ChatBskyActorDefs.ProfileViewBasic[]
      >(listConvoMembersQueryKey(convoId))

      queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(
        CONVO_KEY(convoId),
        prev => {
          if (!prev) return
          const nextMembers = prev.members.filter(m => !members.includes(m.did))
          const removed = prev.members.length - nextMembers.length
          if (!bsky.isType(ChatBskyConvoDefs.groupConvo, prev.kind)) {
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
        InfiniteData<ChatBskyConvoListConvos.$OutputBody>
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
              if (!bsky.isType(ChatBskyConvoDefs.groupConvo, convo.kind)) {
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

      queryClient.setQueryData<ChatBskyActorDefs.ProfileViewBasic[]>(
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
