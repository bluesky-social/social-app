import {AppBskyActorDefs, BskyAgent} from '@atproto-labs/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'
import {RQKEY as PROFILE_RKEY} from '../profile'
import {useHeaders} from './temp-headers'

export function useUpdateActorDeclaration({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()
  const {currentAccount} = useSession()

  return useMutation({
    mutationFn: async (allowIncoming: 'all' | 'none' | 'following') => {
      if (!currentAccount) throw new Error('Not logged in')
      const agent = new BskyAgent({service: serviceUrl})
      const result = await agent.api.chat.bsky.actor.declaration.create(
        {repo: currentAccount.did, rkey: 'self'},
        {allowIncoming},
        headers,
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
