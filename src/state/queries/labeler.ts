import {type DidString} from '@atproto/syntax'
import {addLabeler, removeLabeler} from '@bsky.app/sdk'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'

import {MAX_LABELERS} from '#/lib/constants'
import {GCTIME, STALE} from '#/state/queries'
import {
  preferencesQueryKey,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient, usePdsClient} from '#/state/session'
import {app} from '#/lexicons'

const labelerInfoQueryKeyRoot = 'labeler-info'
export const labelerInfoQueryKey = (did: string) => [
  labelerInfoQueryKeyRoot,
  did,
]

const labelersInfoQueryKeyRoot = 'labelers-info'
export const labelersInfoQueryKey = (dids: string[]) => [
  labelersInfoQueryKeyRoot,
  dids.slice().sort(),
]

const createLabelersDetailedInfoQueryKey = (dids: string[]) =>
  createQueryKey('labelers-detailed-info', {dids}, {persistedVersion: 1})

export function useLabelerInfoQuery({
  did,
  enabled,
}: {
  did?: string
  enabled?: boolean
}) {
  const client = useAppviewClient()
  return useQuery({
    enabled: !!did && enabled !== false,
    queryKey: labelerInfoQueryKey(did as string),
    queryFn: async () => {
      const res = await client.call(app.bsky.labeler.getServices, {
        dids: [did! as DidString],
        detailed: true,
      })
      return res.views[0] as app.bsky.labeler.defs.LabelerViewDetailed
    },
  })
}

export function useLabelersInfoQuery({dids}: {dids: string[]}) {
  const client = useAppviewClient()
  return useQuery({
    enabled: !!dids.length,
    queryKey: labelersInfoQueryKey(dids),
    queryFn: async () => {
      const res = await client.call(app.bsky.labeler.getServices, {
        dids: dids as DidString[],
      })
      return res.views as app.bsky.labeler.defs.LabelerView[]
    },
  })
}

export function useLabelersDetailedInfoQuery({dids}: {dids: string[]}) {
  const client = useAppviewClient()
  return useQuery({
    enabled: !!dids.length,
    queryKey: createLabelersDetailedInfoQueryKey(dids),
    gcTime: GCTIME.INFINITY,
    staleTime: STALE.MINUTES.ONE,
    queryFn: async () => {
      const res = await client.call(app.bsky.labeler.getServices, {
        dids: dids as DidString[],
        detailed: true,
      })
      return res.views as app.bsky.labeler.defs.LabelerViewDetailed[]
    },
  })
}

export function useRemoveLabelersMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation({
    async mutationFn({dids}: {dids: string[]}) {
      await Promise.all(
        dids.map(did => client.call(removeLabeler, did as DidString)),
      )
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useLabelerSubscriptionMutation() {
  const queryClient = useQueryClient()
  const appviewClient = useAppviewClient()
  const pdsClient = usePdsClient()
  const preferences = usePreferencesQuery()

  return useMutation({
    async mutationFn({did, subscribe}: {did: string; subscribe: boolean}) {
      // TODO
      z.object({
        did: z.string(),
        subscribe: z.boolean(),
      }).parse({did, subscribe})

      /**
       * If a user has invalid/takendown/deactivated labelers, we need to
       * remove them. We don't have a great way to do this atm on the server,
       * so we do it here.
       *
       * We also need to push validation into this method, since we need to
       * check {@link MAX_LABELERS} _after_ we've removed invalid or takendown
       * labelers.
       */
      const labelerDids = (
        preferences.data?.moderationPrefs?.labelers ?? []
      ).map(l => l.did)
      const invalidLabelers: DidString[] = []
      if (labelerDids.length) {
        const profiles = await appviewClient.call(app.bsky.actor.getProfiles, {
          actors: labelerDids,
        })
        if (profiles) {
          for (const labelerDid of labelerDids) {
            const exists = profiles.profiles.find(p => p.did === labelerDid)
            if (exists) {
              // profile came back but it's not a valid labeler
              if (exists.associated && !exists.associated.labeler) {
                invalidLabelers.push(labelerDid)
              }
            } else {
              // no response came back, might be deactivated or takendown
              invalidLabelers.push(labelerDid)
            }
          }
        }
      }
      if (invalidLabelers.length) {
        await Promise.all(
          invalidLabelers.map(labelerDid =>
            pdsClient.call(removeLabeler, labelerDid),
          ),
        )
      }

      if (subscribe) {
        const labelerCount = labelerDids.length - invalidLabelers.length
        if (labelerCount >= MAX_LABELERS) {
          throw new Error('MAX_LABELERS')
        }
        await pdsClient.call(addLabeler, did as DidString)
      } else {
        await pdsClient.call(removeLabeler, did as DidString)
      }
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}
