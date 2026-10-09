import {type BlobRef} from '@atproto/lex'
import {type DidString} from '@atproto/syntax'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {uploadBlob} from '#/lib/api'
import {LINK_FAVICON_PROXY} from '#/lib/constants'
import {isNetworkError} from '#/lib/strings/errors'
import {isRecordNotFoundError} from '#/lib/xrpc-error'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {useProfileUpdateMutation} from '#/state/queries/profile'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient, usePdsClient} from '#/state/session'
import {useAnalytics} from '#/analytics'
import {type app, com} from '#/lexicons'
import {
  parseProfileRecordLinks,
  type ProfileLinksData,
  withProfileRecordLinks,
} from './record'

/**
 * Profile links are in the beta program, behind a GrowthBook flag targeted at
 * beta users. Always on in local development.
 */
export function useProfileLinksEnabled() {
  const ax = useAnalytics()
  return __DEV__ || ax.features.enabled(ax.features.ProfileLinksEnable)
}

const profileLinksQueryKeyRoot = 'profileLinks'
export const profileLinksQueryKey = (did: string) =>
  createQueryKey(profileLinksQueryKeyRoot, {did})

/**
 * Reads links from the raw profile record. During the beta they are
 * unofficial `betaLinks` fields, so the AppView's profile views don't include them
 * and we fetch the record itself.
 */
export function useProfileLinksQuery(did: DidString, {enabled = true} = {}) {
  const client = useAppviewClient()
  return useQuery({
    queryKey: profileLinksQueryKey(did),
    enabled,
    staleTime: STALE.MINUTES.ONE,
    queryFn: async (): Promise<ProfileLinksData> => {
      try {
        const res = await client.call(com.atproto.repo.getRecord, {
          repo: did,
          collection: 'app.bsky.actor.profile',
          rkey: 'self',
        })
        return parseProfileRecordLinks(res.value)
      } catch (e) {
        if (isRecordNotFoundError(e)) {
          return {links: [], germIndex: 0}
        }
        throw e
      }
    },
  })
}

/**
 * Updates cached links after a save, since the AppView can take a moment to
 * serve the new record.
 */
export function useSetProfileLinksCache() {
  const queryClient = useQueryClient()
  return (did: string, data: ProfileLinksData) => {
    queryClient.setQueryData(profileLinksQueryKey(did), data)
  }
}

/**
 * Saves the owner's links straight to their profile record, for edits made
 * outside Edit Profile (tapping a link on your own profile).
 */
export function useSaveProfileLinksMutation() {
  const {mutateAsync: updateProfile, isPending} = useProfileUpdateMutation()
  const setProfileLinksCache = useSetProfileLinksCache()
  const save = async (
    profile: app.bsky.actor.defs.ProfileViewDetailed,
    data: ProfileLinksData,
  ) => {
    await updateProfile({
      profile,
      updates: existing => existing,
      updateRecord: record => withProfileRecordLinks(record, data),
    })
    setProfileLinksCache(profile.did, data)
  }
  return {save, isPending}
}

const FAVICON_TIMEOUT = 8e3

/**
 * Fetches a site's favicon through cardyb and uploads it to the user's PDS,
 * like a link card thumbnail. Storing the blob on the record means it's
 * scanned like any other profile image, instead of hotlinked. Resolves to
 * undefined when the site has no usable icon; the pill falls back to a globe.
 */
export function useUploadLinkIcon() {
  const pdsClient = usePdsClient()
  return async (url: string): Promise<BlobRef | undefined> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FAVICON_TIMEOUT)
    let icon: Blob
    try {
      const res = await fetch(
        `${LINK_FAVICON_PROXY()}${encodeURIComponent(url)}`,
        {signal: controller.signal},
      )
      if (!res.ok || res.headers.get('content-type') !== 'image/png') {
        return undefined
      }
      icon = await res.blob()
    } catch {
      // no icon is a normal outcome, e.g. a slow site
      return undefined
    } finally {
      clearTimeout(timeout)
    }
    try {
      const {blob} = await uploadBlob(pdsClient, icon, 'image/png')
      return blob
    } catch (e) {
      if (!isNetworkError(e)) {
        logger.error('Failed to upload profile link icon', {safeMessage: e})
      }
      return undefined
    }
  }
}
