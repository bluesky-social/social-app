import {
  type AppBskyActorDefs,
  type ChatBskyActorDeclaration,
} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {type SessionAgent} from '#/state/session'
import {useAgent, useSession} from '#/state/session'
import {resolveAllowGroupInvites} from '#/components/dms/util'
import {RQKEY as PROFILE_RKEY} from '../profile'

export function useUpdateActorDeclaration({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const agent = useAgent()

  return useMutation({
    mutationFn: async (update: {
      allowIncoming?: 'all' | 'none' | 'following'
      allowGroupInvites?: 'all' | 'none' | 'following'
    }) => {
      if (!currentAccount) throw new Error('Not signed in')
      const current =
        queryClient.getQueryData<AppBskyActorDefs.ProfileViewDetailed>(
          PROFILE_RKEY(currentAccount.did),
        )
      const allowIncoming =
        update.allowIncoming ??
        current?.associated?.chat?.allowIncoming ??
        'following'
      const allowGroupInvites = resolveAllowGroupInvites({
        allowIncoming,
        allowGroupInvites:
          update.allowGroupInvites ??
          current?.associated?.chat?.allowGroupInvites,
      })
      const result = await agent.com.atproto.repo.putRecord({
        repo: currentAccount.did,
        collection: 'chat.bsky.actor.declaration',
        rkey: 'self',
        record: {
          $type: 'chat.bsky.actor.declaration',
          allowIncoming,
          allowGroupInvites,
        },
      })
      return result
    },
    onMutate: update => {
      if (!currentAccount) return
      queryClient.setQueryData(
        PROFILE_RKEY(currentAccount?.did),
        (old?: AppBskyActorDefs.ProfileViewDetailed) => {
          if (!old) return old
          const allowIncoming =
            update.allowIncoming ??
            old.associated?.chat?.allowIncoming ??
            'following'
          // resolve the same concrete value the server will receive, so
          // optimistic cache and persisted record stay aligned
          const allowGroupInvites = resolveAllowGroupInvites({
            allowIncoming,
            allowGroupInvites:
              update.allowGroupInvites ??
              old.associated?.chat?.allowGroupInvites,
          })
          return {
            ...old,
            associated: {
              ...old.associated,
              chat: {
                ...old.associated?.chat,
                allowIncoming,
                allowGroupInvites,
              },
            },
          } satisfies AppBskyActorDefs.ProfileViewDetailed
        },
      )
    },
    onSuccess,
    onError: error => {
      logger.error(error)
      if (currentAccount) {
        void queryClient.invalidateQueries({
          queryKey: PROFILE_RKEY(currentAccount.did),
        })
      }
      onError?.(error)
    },
  })
}

// for use in the settings screen for testing
export function useDeleteActorDeclaration() {
  const {currentAccount} = useSession()
  const agent = useAgent()

  return useMutation({
    mutationFn: async () => {
      if (!currentAccount) throw new Error('Not signed in')
      const result = await agent.api.com.atproto.repo.deleteRecord({
        repo: currentAccount.did,
        collection: 'chat.bsky.actor.declaration',
        rkey: 'self',
      })
      return result
    },
  })
}

export async function fetchActorDeclarationRecord({
  agent,
  did,
}: {
  agent: SessionAgent
  did?: string
}) {
  if (!did) return
  const res = await agent.com.atproto.repo
    .getRecord({
      repo: did,
      collection: 'chat.bsky.actor.declaration',
      rkey: 'self',
    })
    .catch(_e => undefined)
  return res?.data.value as ChatBskyActorDeclaration.Main
}
