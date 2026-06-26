import {useCallback} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {communityXrpc} from '#/lib/api/community'
import {useAgent} from '#/state/session'
import {BLACKSKY_LABELER} from '#/state/session/additional-moderation-authorities'

const APPLY_METHOD = 'community.blacksky.moderation.applyLabel'
const REMOVE_METHOD = 'community.blacksky.moderation.removeLabel'
const GET_MY_LABELS_METHOD = 'community.blacksky.moderation.getMyLabels'

export type ApplyLabelInput = {
  subjectUri: string
  subjectCid: string
  val: string
  reason?: string
}

export type RemoveLabelInput = {
  subjectUri: string
  val: string
}

const MY_LABELS_RQKEY_ROOT = 'peer-mod-my-labels'
export const myLabelsRQKey = (subjectUri: string) => [
  MY_LABELS_RQKEY_ROOT,
  subjectUri,
]

const POST_LABELS_RQKEY_ROOT = 'peer-mod-post-labels'
export const postLabelsRQKey = (subjectUri: string) => [
  POST_LABELS_RQKEY_ROOT,
  subjectUri,
]

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as {message?: string}
  return body.message || `${res.status}`
}

/**
 * Labels the current peer mod has applied to a given post, used to gate the
 * remove affordance and reflect already-applied state. Peer mods can only
 * remove labels they applied themselves.
 */
export function useMyAppliedLabelsQuery(subjectUri: string | undefined) {
  const agent = useAgent()
  return useQuery<string[]>({
    queryKey: myLabelsRQKey(subjectUri || ''),
    enabled: !!subjectUri,
    queryFn: async () => {
      if (!subjectUri) return []
      try {
        const res = await communityXrpc(agent, GET_MY_LABELS_METHOD, {
          params: {subjectUri},
        })
        if (!res.ok) return []
        const data = (await res.json()) as {vals?: string[]}
        return data.vals ?? []
      } catch {
        // Backend may not be reachable yet; treat as "none applied by me".
        return []
      }
    },
  })
}

/**
 * Blacksky labels currently present on a post (from any source), used to show
 * already-applied state and prevent double-application.
 */
export function usePostBlackskyLabelsQuery(subjectUri: string | undefined) {
  const agent = useAgent()
  return useQuery<string[]>({
    queryKey: postLabelsRQKey(subjectUri || ''),
    enabled: !!subjectUri,
    queryFn: async () => {
      if (!subjectUri) return []
      const res = await agent.com.atproto.label.queryLabels({
        uriPatterns: [subjectUri],
        sources: [BLACKSKY_LABELER],
      })
      return res.data.labels.filter(l => !l.neg).map(l => l.val)
    },
  })
}

export function useApplyLabelMutation() {
  const agent = useAgent()
  const invalidate = useInvalidateLabelState()
  return useMutation<void, Error, ApplyLabelInput>({
    mutationFn: async input => {
      const res = await communityXrpc(agent, APPLY_METHOD, {body: input})
      if (!res.ok) {
        throw new Error(await readError(res))
      }
    },
    onSuccess: (_data, input) => {
      invalidate(input.subjectUri)
    },
  })
}

export function useRemoveLabelMutation() {
  const agent = useAgent()
  const invalidate = useInvalidateLabelState()
  return useMutation<void, Error, RemoveLabelInput>({
    mutationFn: async input => {
      const res = await communityXrpc(agent, REMOVE_METHOD, {body: input})
      if (!res.ok) {
        throw new Error(await readError(res))
      }
    },
    onSuccess: (_data, input) => {
      invalidate(input.subjectUri)
    },
  })
}

function useInvalidateLabelState() {
  const queryClient = useQueryClient()
  return useCallback(
    (subjectUri: string) => {
      void queryClient.invalidateQueries({queryKey: myLabelsRQKey(subjectUri)})
      void queryClient.invalidateQueries({queryKey: postLabelsRQKey(subjectUri)})
    },
    [queryClient],
  )
}
