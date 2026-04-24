import {
  type ChatBskyActorDefs,
  type ChatBskyConvoDefs,
  type ChatBskyConvoListConvos,
  type ChatBskyGroupRemoveMembers,
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
import {listConvoMembersQueryKey} from './list-convo-members'

export function useRemoveFromGroupChat(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyGroupRemoveMembers.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({members}: {members: string[]}) => {
      if (!convoId) throw new Error('No convoId provided')
      const {data} = await agent.chat.bsky.group.removeMembers(
        {convoId, members},
        {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
      )
      return data
    },
    onMutate: ({members}) => {
      if (!convoId) return

      const prevConvo = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(
        CONVO_KEY(convoId),
      )
      const prevListEntries = queryClient.getQueriesData<
        InfiniteData<ChatBskyConvoListConvos.OutputSchema>
      >({queryKey: [CONVO_LIST_KEY]})
      const prevMemberList = queryClient.getQueryData<
        ChatBskyActorDefs.ProfileViewBasic[]
      >(listConvoMembersQueryKey(convoId))

      queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(
        CONVO_KEY(convoId),
        prev => {
          if (!prev) return
          return {
            ...prev,
            members: prev.members.filter(m => !members.includes(m.did)),
          }
        },
      )

      queryClient.setQueriesData<
        InfiniteData<ChatBskyConvoListConvos.OutputSchema>
      >({queryKey: [CONVO_LIST_KEY]}, prev => {
        if (!prev?.pages) return
        return {
          ...prev,
          pages: prev.pages.map(page => ({
            ...page,
            convos: page.convos.map(convo => {
              if (convo.id !== convoId) return convo
              return {
                ...convo,
                members: convo.members.filter(m => !members.includes(m.did)),
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
