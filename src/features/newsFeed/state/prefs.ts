import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'

import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAgent, useSession} from '#/state/session'

/**
 * Collection NSID for the per-user news feed preferences record, stored as a
 * singleton at rkey `self` (mirroring `app.bsky.actor.profile`).
 *
 * The `redacted` authority segment is a placeholder until the real domain is
 * decided.
 */
export const NEWS_FEED_PREFS_NSID = 'social.redacted.newsFeedPrefs'
const NEWS_FEED_PREFS_RKEY = 'self'

/**
 * Empty `topics` means setup is unfinished (callers show the topic picker).
 * Empty `regions` means no region filter. Language isn't stored here - the feed
 * uses the app's normal content language preference.
 */
export const newsFeedPrefsSchema = z.object({
  topics: z.array(z.string()),
  regions: z.array(z.string()),
  excludedDids: z.array(z.string()),
  createdAt: z.string(),
})
export type NewsFeedPrefs = z.infer<typeof newsFeedPrefsSchema>

export function makeDefaultNewsFeedPrefs(): NewsFeedPrefs {
  return {
    topics: [],
    regions: [],
    excludedDids: [],
    createdAt: new Date().toISOString(),
  }
}

const newsFeedPrefsQueryKeyRoot = 'newsFeedPrefs'
export const createNewsFeedPrefsQueryKey = (args: {did?: string}) =>
  createQueryKey(newsFeedPrefsQueryKeyRoot, args)

/**
 * Reads the current user's news feed prefs record. Returns `null` when the
 * record does not exist yet (i.e. the user has not set up the news feed).
 */
export function useNewsFeedPrefsQuery() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const did = currentAccount?.did

  return useQuery<NewsFeedPrefs | null>({
    queryKey: createNewsFeedPrefsQueryKey({did}),
    staleTime: STALE.MINUTES.ONE,
    enabled: !!did,
    queryFn: async () => {
      try {
        const res = await agent.com.atproto.repo.getRecord({
          repo: did!,
          collection: NEWS_FEED_PREFS_NSID,
          rkey: NEWS_FEED_PREFS_RKEY,
        })
        const parsed = newsFeedPrefsSchema.safeParse(res.data.value)
        if (!parsed.success) {
          logger.error('newsFeedPrefs: record failed validation', {
            safeMessage: parsed.error.message,
          })
          return null
        }
        return parsed.data
      } catch (e) {
        if (
          e instanceof Error &&
          e.message.includes('Could not locate record:')
        ) {
          return null
        }
        throw e
      }
    },
  })
}

export function useNewsFeedPrefsMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()

  return useMutation<void, unknown, NewsFeedPrefs>({
    mutationFn: async prefs => {
      if (!currentAccount) throw new Error('Not signed in')
      await agent.com.atproto.repo.putRecord({
        repo: currentAccount.did,
        collection: NEWS_FEED_PREFS_NSID,
        rkey: NEWS_FEED_PREFS_RKEY,
        validate: false,
        record: {
          $type: NEWS_FEED_PREFS_NSID,
          ...prefs,
        },
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: createNewsFeedPrefsQueryKey({did: currentAccount?.did}),
      })
    },
    onError: error => {
      logger.error('newsFeedPrefs: failed to save', {safeMessage: error})
    },
  })
}

export function useNewsFeedPrefsDeleteMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()

  return useMutation({
    mutationFn: async () => {
      if (!currentAccount) throw new Error('Not signed in')
      await agent.com.atproto.repo.deleteRecord({
        repo: currentAccount.did,
        collection: NEWS_FEED_PREFS_NSID,
        rkey: NEWS_FEED_PREFS_RKEY,
      })
    },
    onMutate: () => {
      // Optimistically clear so the UI returns to the unconfigured state
      // without waiting for the network round-trip.
      queryClient.setQueryData(
        createNewsFeedPrefsQueryKey({did: currentAccount?.did}),
        null,
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: createNewsFeedPrefsQueryKey({did: currentAccount?.did}),
      })
    },
    onError: error => {
      logger.error('newsFeedPrefs: failed to delete', {safeMessage: error})
    },
  })
}
