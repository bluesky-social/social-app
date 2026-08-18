import {t} from '@lingui/core/macro'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {isRecordNotFoundError} from '#/lib/xrpc-error'
import {createQueryKey} from '#/state/queries/util'
import {usePdsClient, useSession} from '#/state/session'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {app} from '#/lexicons'

export const contentVisibilityQueryKey = (did: string) =>
  createQueryKey('content-visibility', {did})

export function useContentVisibilityQuery() {
  const client = usePdsClient()
  const {currentAccount} = useSession()
  const did = currentAccount?.did

  return useQuery({
    queryKey: contentVisibilityQueryKey(did ?? ''),
    queryFn: async () => {
      try {
        const response = await client.get(
          app.bsky.actor.contentVisibilityDeclaration,
          {
            repo: did!,
            rkey: 'self',
          },
        )
        return app.bsky.actor.contentVisibilityDeclaration.$parse(
          response.value,
        )
      } catch (error) {
        if (isRecordNotFoundError(error)) {
          return app.bsky.actor.contentVisibilityDeclaration.$build({
            hideFromAlgorithmicRecommendations: false,
          })
        }
        throw error
      }
    },
    enabled: !!did,
  })
}

export function useContentVisibilityMutation() {
  const ax = useAnalytics()
  const client = usePdsClient()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  const did = currentAccount?.did
  const queryKey = contentVisibilityQueryKey(did ?? '')

  return useMutation({
    mutationFn: async (hideFromAlgorithmicRecommendations: boolean) => {
      if (!did) throw new Error('Not signed in')

      const record = app.bsky.actor.contentVisibilityDeclaration.$build({
        hideFromAlgorithmicRecommendations,
      })
      await client.put(app.bsky.actor.contentVisibilityDeclaration, record, {
        repo: did,
        rkey: 'self',
      })
      return record
    },
    onMutate: async hideFromAlgorithmicRecommendations => {
      await queryClient.cancelQueries({queryKey})
      const previous =
        queryClient.getQueryData<app.bsky.actor.contentVisibilityDeclaration.Main>(
          queryKey,
        )
      queryClient.setQueryData(
        queryKey,
        app.bsky.actor.contentVisibilityDeclaration.$build({
          hideFromAlgorithmicRecommendations,
        }),
      )
      return {previous}
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      Toast.show(t`Failed to update content visibility`)
    },
    onSuccess: (_record, hide) => {
      ax.metric('contentVisibility:algorithmicRecommendations:change', {hide})
    },
    onSettled: () => {
      void queryClient.invalidateQueries({queryKey})
    },
  })
}
