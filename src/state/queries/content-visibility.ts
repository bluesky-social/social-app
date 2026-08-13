import {t} from '@lingui/core/macro'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useAgent, useSession} from '#/state/session'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {
  CONTENT_VISIBILITY_COLLECTION,
  CONTENT_VISIBILITY_RKEY,
  type ContentVisibilityRecord,
  createContentVisibilityRecord,
  parseContentVisibilityRecord,
} from './content-visibility-record'

export const contentVisibilityQueryKey = (did: string) => [
  'content-visibility',
  did,
]

export function useContentVisibilityQuery() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const did = currentAccount?.did

  return useQuery({
    queryKey: contentVisibilityQueryKey(did ?? ''),
    queryFn: async () => {
      try {
        const response = await agent.com.atproto.repo.getRecord({
          repo: did!,
          collection: CONTENT_VISIBILITY_COLLECTION,
          rkey: CONTENT_VISIBILITY_RKEY,
        })
        return parseContentVisibilityRecord(response.data.value)
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith('Could not locate record')
        ) {
          return createContentVisibilityRecord(false)
        }
        throw error
      }
    },
    enabled: !!did,
  })
}

export function useContentVisibilityMutation() {
  const ax = useAnalytics()
  const agent = useAgent()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  const did = currentAccount?.did
  const queryKey = contentVisibilityQueryKey(did ?? '')

  return useMutation({
    mutationFn: async (hideFromAlgorithmicRecommendations: boolean) => {
      if (!did) throw new Error('Not signed in')

      const record = createContentVisibilityRecord(
        hideFromAlgorithmicRecommendations,
      )
      await agent.com.atproto.repo.putRecord({
        repo: did,
        collection: CONTENT_VISIBILITY_COLLECTION,
        rkey: CONTENT_VISIBILITY_RKEY,
        record,
      })
      return record
    },
    onMutate: async hideFromAlgorithmicRecommendations => {
      await queryClient.cancelQueries({queryKey})
      const previous =
        queryClient.getQueryData<ContentVisibilityRecord>(queryKey)
      queryClient.setQueryData(
        queryKey,
        createContentVisibilityRecord(hideFromAlgorithmicRecommendations),
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
