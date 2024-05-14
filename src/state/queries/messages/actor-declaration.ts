import {AppBskyActorDefs} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useAgent, useSession} from '#/state/session'
import {RQKEY as PROFILE_RKEY} from '../profile'
import {DM_SERVICE_HEADERS} from './const'

export function useUpdateActorDeclaration({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const {getAgent} = useAgent()

  return useMutation({
    mutationFn: async (allowIncoming: 'all' | 'none' | 'following') => {
      if (!currentAccount) throw new Error('Not logged in')
      const result = await getAgent().api.chat.bsky.actor.declaration.create(
        {repo: currentAccount.did, rkey: 'self'},
        {allowIncoming},
        DM_SERVICE_HEADERS,
      )
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
