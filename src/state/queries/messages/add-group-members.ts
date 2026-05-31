import {
  type ChatBskyActorDefs,
  ChatBskyConvoDefs,
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
import {useProfileQuery} from '#/state/queries/profile'
import {useAgent, useSession} from '#/state/session'
import type * as bsky from '#/types/bsky'
import {RQKEY as CONVO_KEY} from './conversation'
import {RQKEY_ROOT as CONVO_LIST_KEY} from './list-conversations'
import {listConvoMembersQueryKey} from './list-convo-members'

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
  const {currentAccount} = useSession()
  const {data: myProfile} = useProfileQuery({did: currentAccount?.did})

  return useMutation({
    mutationFn: async ({
      members,
    }: {
      members: string[]
      profiles: bsky.profile.AnyProfileView[]
    }) => {
      if (!convoId) throw new Error('No convoId provided')
      const {data} = await agent.chat.bsky.group.addMembers(
        {convoId, members},
        {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
      )
      return data
    },
    onMutate: ({profiles}) => {
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

      const addedBy: ChatBskyActorDefs.ProfileViewBasic | undefined = myProfile
        ? {
            ...myProfile,
            $type: 'chat.bsky.actor.defs#profileViewBasic',
          }
        : undefined

      const optimisticMembers: ChatBskyActorDefs.ProfileViewBasic[] =
        profiles.map(profile => ({
          ...profile,
          $type: 'chat.bsky.actor.defs#profileViewBasic',
          kind: {
            $type: 'chat.bsky.actor.defs#groupConvoMember',
            role: 'standard',
            addedBy,
          },
        }))

      queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(
        CONVO_KEY(convoId),
        prev => {
          if (!prev) return
          if (!ChatBskyConvoDefs.isGroupConvo(prev.kind)) return prev
          return {
            ...prev,
            members: [...prev.members, ...optimisticMembers],
            kind: {
              ...prev.kind,
              memberCount: prev.kind.memberCount + optimisticMembers.length,
            },
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
              if (!ChatBskyConvoDefs.isGroupConvo(convo.kind)) return convo
              return {
                ...convo,
                members: [...convo.members, ...optimisticMembers],
                kind: {
                  ...convo.kind,
                  memberCount:
                    convo.kind.memberCount + optimisticMembers.length,
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
          return [...prev, ...optimisticMembers]
        },
      )

      return {prevConvo, prevListEntries, prevMemberList}
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
