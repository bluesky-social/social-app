import {AppBskyActorDefs} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useAgent, useSession} from '#/state/session'
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
    mutationFn: async (allowIncoming: 'all' | 'none' | 'following') => {
      if (!currentAccount) throw new Error('Not logged in')
      const result = await agent.api.com.atproto.repo.putRecord({
        repo: currentAccount.did,
        collection: 'chat.bsky.actor.declaration',
        rkey: 'self',
        record: {
          $type: 'chat.bsky.actor.declaration',
          allowIncoming,
        },
      })
      return result
    },
    onMutate: allowIncoming => {
      if (!currentAccount) return
      queryClient.setQueryData(
        PROFILE_RKEY(currentAccount?.did),
        (old?: AppBskyActorDefs.ProfileViewDetailed) => {
          if (!old) return old
          return {
            ...old,
            associated: {
              ...old.associated,
              chat: {
                allowIncoming,
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
        queryClient.invalidateQueries({
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
      if (!currentAccount) throw new Error('Not logged in')
      // TODO(sam): remove validate: false once PDSes have the new lexicon
      const result = await agent.api.com.atproto.repo.deleteRecord({
        repo: currentAccount.did,
        collection: 'chat.bsky.actor.declaration',
        rkey: 'self',
        validate: false,
      })
      return result
    },
  })
}
