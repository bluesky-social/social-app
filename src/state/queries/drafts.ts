/**
 * API query hooks for drafts
 *
 * These hooks interact with the server-side drafts API:
 * - app.bsky.draft.createDraft()
 * - app.bsky.draft.getDrafts()
 * - app.bsky.draft.updateDraft()
 * - app.bsky.draft.deleteDraft()
 *
 * Note: These are placeholder implementations. The actual API
 * endpoints need to be implemented on the backend.
 */

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

const RQKEY_ROOT = 'server-drafts'

export function serverDraftsQueryKey(did: string) {
  return [RQKEY_ROOT, did]
}

/**
 * Fetch drafts from the server
 */
export function useServerDraftsQuery(did: string) {
  const _agent = useAgent()

  return useQuery({
    queryKey: serverDraftsQueryKey(did),
    queryFn: async () => {
      // TODO: Implement when API is available
      // const res = await agent.app.bsky.draft.getDrafts()
      // return res.data.drafts
      return []
    },
    enabled: Boolean(did),
  })
}

/**
 * Create a draft on the server
 */
export function useCreateServerDraftMutation() {
  const _agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (_draft: {
      text: string
      // Add other fields as per API spec
    }) => {
      // TODO: Implement when API is available
      // const res = await agent.app.bsky.draft.createDraft(draft)
      // return res.data
      throw new Error('Server drafts API not yet implemented')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [RQKEY_ROOT]})
    },
  })
}

/**
 * Update a draft on the server
 */
export function useUpdateServerDraftMutation() {
  const _agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (_params: {
      id: string
      text: string
      // Add other fields as per API spec
    }) => {
      // TODO: Implement when API is available
      // const res = await agent.app.bsky.draft.updateDraft(params)
      // return res.data
      throw new Error('Server drafts API not yet implemented')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [RQKEY_ROOT]})
    },
  })
}

/**
 * Delete a draft from the server
 */
export function useDeleteServerDraftMutation() {
  const _agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (_id: string) => {
      // TODO: Implement when API is available
      // await agent.app.bsky.draft.deleteDraft({id})
      throw new Error('Server drafts API not yet implemented')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [RQKEY_ROOT]})
    },
  })
}
