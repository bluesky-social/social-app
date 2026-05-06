import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {useAgent, useSession} from '#/state/session'
import {buildGlobalRecord, type Patch} from './serde'
import {AI_PREFERENCE_NSID, type AIPreferenceRecord} from './types'

const RQKEY_ROOT = 'ai-preferences'

export const RQKEY = (did: string | undefined) => [
  RQKEY_ROOT,
  did ?? '<no-account>',
]

function isRecordNotFoundError(e: unknown): boolean {
  if (e instanceof Error) {
    return e.message.includes('Could not locate record:')
  }
  return false
}

export function useAIPreferencesQuery() {
  const {currentAccount} = useSession()
  const agent = useAgent()

  return useQuery<AIPreferenceRecord | null>({
    queryKey: RQKEY(currentAccount?.did),
    enabled: !!currentAccount?.did,
    staleTime: STALE.MINUTES.FIVE,
    queryFn: async () => {
      if (!currentAccount) throw new Error('Not signed in')
      try {
        const {data} = await agent.com.atproto.repo.getRecord({
          repo: currentAccount.did,
          collection: AI_PREFERENCE_NSID,
          rkey: 'self',
        })
        return data.value as AIPreferenceRecord
      } catch (e) {
        if (isRecordNotFoundError(e)) return null
        throw e
      }
    },
  })
}

export function useUpdateAIPreferencesMutation({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: Error) => void
} = {}) {
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const agent = useAgent()

  type Ctx = {prev: AIPreferenceRecord | null}

  return useMutation<void, Error, Patch, Ctx>({
    mutationFn: async patch => {
      if (!currentAccount) throw new Error('Not signed in')
      const queryKey = RQKEY(currentAccount.did)
      const prev =
        queryClient.getQueryData<AIPreferenceRecord | null>(queryKey) ?? null
      const next = buildGlobalRecord(prev, patch)
      await agent.com.atproto.repo.putRecord({
        repo: currentAccount.did,
        collection: AI_PREFERENCE_NSID,
        rkey: 'self',
        record: next,
      })
    },
    onMutate: async patch => {
      if (!currentAccount) return
      const queryKey = RQKEY(currentAccount.did)
      await queryClient.cancelQueries({queryKey})
      const prev =
        queryClient.getQueryData<AIPreferenceRecord | null>(queryKey) ?? null
      const next = buildGlobalRecord(prev, patch)
      queryClient.setQueryData<AIPreferenceRecord | null>(queryKey, next)
      return {prev}
    },
    onSuccess: () => {
      onSuccess?.()
    },
    onError: (error, _patch, context) => {
      logger.error('Failed to update AI preferences', {safeMessage: error})
      if (currentAccount && context) {
        queryClient.setQueryData<AIPreferenceRecord | null>(
          RQKEY(currentAccount.did),
          context.prev,
        )
      }
      onError?.(error)
    },
    onSettled: () => {
      if (currentAccount) {
        void queryClient.invalidateQueries({
          queryKey: RQKEY(currentAccount.did),
        })
      }
    },
  })
}
