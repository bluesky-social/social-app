import {type DidString} from '@atproto/syntax'
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useProfileQuery} from '#/state/queries/profile'
import {useChatClient, useSession} from '#/state/session'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {RQKEY as CONVO_KEY} from './conversation'
import {RQKEY_ROOT as CONVO_LIST_KEY} from './list-conversations'
import {listConvoMembersQueryKey} from './list-convo-members'

export function useAddGroupMembers(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: chat.bsky.group.addMembers.$OutputBody) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const chatClient = useChatClient()
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
      const data = await chatClient.call(chat.bsky.group.addMembers, {
        convoId,
        members: members as DidString[],
      })
      return data
    },
    onMutate: ({profiles}) => {
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

      /*
       * The profile views come from producers that still emit the old
       * `@atproto/api` shapes (useProfileQuery migrates in a later task), while
       * the chat caches are now typed on the lexicon views. Structurally
       * identical modulo branded strings. TODO(phase4): drop toLex once those
       * producers migrate.
       */
      const addedBy: chat.bsky.actor.defs.ProfileViewBasic | undefined =
        myProfile
          ? bsky.toLex<chat.bsky.actor.defs.ProfileViewBasic>({
              ...myProfile,
              $type: 'chat.bsky.actor.defs#profileViewBasic',
            })
          : undefined

      const optimisticMembers: chat.bsky.actor.defs.ProfileViewBasic[] =
        profiles.map(profile =>
          bsky.toLex<chat.bsky.actor.defs.ProfileViewBasic>({
            ...profile,
            $type: 'chat.bsky.actor.defs#profileViewBasic',
            kind: {
              $type: 'chat.bsky.actor.defs#groupConvoMember',
              role: 'standard',
              addedBy,
            },
          }),
        )

      queryClient.setQueryData<chat.bsky.convo.defs.ConvoView>(
        CONVO_KEY(convoId),
        prev => {
          if (!prev) return
          if (!bsky.isType(chat.bsky.convo.defs.groupConvo, prev.kind))
            return prev
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
        InfiniteData<chat.bsky.convo.listConvos.$OutputBody>
      >({queryKey: [CONVO_LIST_KEY]}, prev => {
        if (!prev?.pages) return
        return {
          ...prev,
          pages: prev.pages.map(page => ({
            ...page,
            convos: page.convos.map(convo => {
              if (convo.id !== convoId) return convo
              if (!bsky.isType(chat.bsky.convo.defs.groupConvo, convo.kind))
                return convo
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

      queryClient.setQueryData<chat.bsky.actor.defs.ProfileViewBasic[]>(
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
        queryClient.setQueryData<chat.bsky.convo.defs.ConvoView>(
          CONVO_KEY(convoId),
          data.convo,
        )

        queryClient.setQueriesData<
          InfiniteData<chat.bsky.convo.listConvos.$OutputBody>
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
