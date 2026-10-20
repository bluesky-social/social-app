import {type BlobRef, getBlobCidString, type l} from '@atproto/lex'
import {
  AtUri,
  type DidString,
  toDatetimeString,
  type UriString,
} from '@atproto/syntax'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {uploadBlob} from '#/lib/api'
import {LINK_FAVICON_PROXY} from '#/lib/constants'
import {blobToDataUri} from '#/lib/media/util'
import {isNetworkError} from '#/lib/strings/errors'
import {isRecordNotFoundError} from '#/lib/xrpc-error'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {STALE} from '#/state/queries'
import {useProfileUpdateMutation} from '#/state/queries/profile'
import {createQueryKey} from '#/state/queries/util'
import {usePdsClient} from '#/state/session'
import {useAgeAssurance} from '#/ageAssurance'
import {useAnalytics} from '#/analytics'
import {app} from '#/lexicons'
import {
  filterModeratedLinkViews,
  linksFromProfileView,
  linksFromRecords,
} from './record'
import {type ProfileLink} from './types'

/**
 * Profile links roll out behind a GrowthBook flag. Always on in local
 * development.
 */
export function useProfileLinksEnabled() {
  const ax = useAnalytics()
  return __DEV__ || ax.features.enabled(ax.features.ProfileLinksEnable)
}

/**
 * Someone's links from their profile view, minus any that labels hide for
 * this viewer. Empty until moderation settings load, so a hidden link never
 * flashes in.
 */
export function useProfileViewLinks(
  profile: app.bsky.actor.defs.ProfileViewDetailed,
): ProfileLink[] {
  const moderationOpts = useModerationOpts()
  if (!moderationOpts) return []
  return linksFromProfileView(
    filterModeratedLinkViews(profile.links, moderationOpts),
  )
}

/**
 * Whether the current account can add or edit its links. Age-restricted
 * accounts, like those in Safe mode, still see links but can't add them.
 */
export function useCanEditProfileLinks() {
  const enabled = useProfileLinksEnabled()
  const aa = useAgeAssurance()
  return enabled && !aa.flags.isAgeRestricted
}

type StrongRef = {uri: l.AtUriString; cid: l.CidString}

const ownProfileLinksQueryKeyRoot = 'ownProfileLinks'
const ownProfileLinksQueryKey = (did: string) =>
  createQueryKey(ownProfileLinksQueryKeyRoot, {did})

/**
 * The owner's links read from their own repo, for editing. Profile views only
 * carry icon URLs, and saving a link back needs its icon blob.
 */
export function useOwnProfileLinksQuery(did: DidString, {enabled = true} = {}) {
  const pdsClient = usePdsClient()
  return useQuery({
    queryKey: ownProfileLinksQueryKey(did),
    enabled,
    staleTime: STALE.MINUTES.ONE,
    queryFn: async (): Promise<ProfileLink[]> => {
      let refs: StrongRef[] | undefined
      try {
        const res = await pdsClient.get(app.bsky.actor.profile, {repo: did})
        refs = res.value.links
      } catch (e) {
        if (isRecordNotFoundError(e)) return []
        throw e
      }
      const records = await Promise.all(
        (refs ?? []).map(async ref => {
          try {
            const res = await pdsClient.get(app.bsky.actor.link, {
              repo: did,
              rkey: new AtUri(ref.uri).rkey,
            })
            return {uri: res.uri, cid: res.cid as string, value: res.value}
          } catch (e) {
            // the profile can point at a record that was since deleted
            if (isRecordNotFoundError(e)) return undefined
            throw e
          }
        }),
      )
      return linksFromRecords(
        refs,
        records.filter(record => record !== undefined),
      )
    },
  })
}

function sameIcon(a: BlobRef | undefined, b: BlobRef | undefined) {
  return (a && getBlobCidString(a)) === (b && getBlobCidString(b))
}

/**
 * Writes link records so they match `links`: unchanged links keep their
 * record, edited ones are rewritten in place, and new ones are created.
 * Resolves to refs for the profile's `links` field, plus a cleanup that
 * deletes the records of removed links. Run the cleanup after the profile
 * stops pointing at them.
 */
export function useWriteProfileLinks() {
  const pdsClient = usePdsClient()
  return async (
    did: DidString,
    links: ProfileLink[],
    existing: ProfileLink[],
  ): Promise<{refs: StrongRef[]; deleteRemoved: () => Promise<void>}> => {
    const existingByUri = new Map(
      existing.flatMap(link => (link.uri ? [[link.uri, link]] : [])),
    )
    const refs = await Promise.all(
      links.map(async (link): Promise<StrongRef> => {
        const before = link.uri ? existingByUri.get(link.uri) : undefined
        if (
          before?.uri &&
          before.cid &&
          before.url === link.url &&
          before.title === link.title &&
          sameIcon(before.icon, link.icon)
        ) {
          return {
            uri: before.uri as l.AtUriString,
            cid: before.cid,
          }
        }
        const record = {
          url: link.url as UriString,
          title: link.title,
          icon: link.icon,
          createdAt: toDatetimeString(new Date()),
        }
        const res = before?.uri
          ? await pdsClient.put(app.bsky.actor.link, record, {
              repo: did,
              rkey: new AtUri(before.uri).rkey,
            })
          : await pdsClient.create(app.bsky.actor.link, record, {repo: did})
        return {uri: res.uri, cid: res.cid}
      }),
    )
    const kept = new Set(refs.map(ref => ref.uri as string))
    const removed = existing.filter(link => link.uri && !kept.has(link.uri))
    /*
     * A record left behind isn't shown, since the profile no longer points at
     * it, so a failed delete doesn't fail the save.
     */
    const deleteRemoved = async () => {
      try {
        await Promise.all(
          removed.map(link =>
            pdsClient.delete(app.bsky.actor.link, {
              repo: did,
              rkey: new AtUri(link.uri!).rkey,
            }),
          ),
        )
      } catch (e) {
        if (!isNetworkError(e)) {
          logger.error('Failed to delete profile link records', {
            safeMessage: e,
          })
        }
      }
    }
    return {refs, deleteRemoved}
  }
}

/**
 * Keeps the owner's editor in step after a save, so reopening it doesn't show
 * the old links while the query refetches.
 */
export function useSetOwnProfileLinksCache() {
  const queryClient = useQueryClient()
  return (did: string, links: ProfileLink[], refs: StrongRef[]) => {
    queryClient.setQueryData<ProfileLink[]>(
      ownProfileLinksQueryKey(did),
      links.map((link, i) => ({...link, uri: refs[i].uri, cid: refs[i].cid})),
    )
  }
}

/**
 * Saves the owner's links, for edits made outside Edit Profile (tapping a link
 * on your own profile).
 */
export function useSaveProfileLinksMutation() {
  const {mutateAsync: updateProfile, isPending} = useProfileUpdateMutation()
  const writeProfileLinks = useWriteProfileLinks()
  const setOwnProfileLinksCache = useSetOwnProfileLinksCache()
  const save = async (
    profile: app.bsky.actor.defs.ProfileViewDetailed,
    links: ProfileLink[],
    existing: ProfileLink[],
  ) => {
    const {refs, deleteRemoved} = await writeProfileLinks(
      profile.did,
      links,
      existing,
    )
    await updateProfile({
      profile,
      updates: record => ({...record, links: refs.length ? refs : undefined}),
      checkCommitted: fresh =>
        (fresh?.links ?? []).map(link => link.cid).join() ===
        refs.map(ref => ref.cid).join(),
    })
    setOwnProfileLinksCache(profile.did, links, refs)
    await deleteRemoved()
  }
  return {save, isPending}
}

const FAVICON_TIMEOUT = 8e3

/**
 * Fetches a site's favicon through cardyb and uploads it to the user's PDS,
 * like a link card thumbnail. Storing the blob on the record means it's
 * scanned like any other profile image, instead of hotlinked. Resolves to
 * undefined when the site has no usable icon; the pill falls back to a globe.
 *
 * Also resolves to a data URI of the icon: the CDN can't serve the blob until
 * the profile is saved and a record points at it, so the editor shows this
 * instead.
 */
export function useUploadLinkIcon() {
  const pdsClient = usePdsClient()
  return async (
    url: string,
  ): Promise<{icon: BlobRef; previewUrl: string} | undefined> => {
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
      const [{blob}, previewUrl] = await Promise.all([
        uploadBlob(pdsClient, icon, 'image/png'),
        blobToDataUri(icon),
      ])
      return {icon: blob, previewUrl}
    } catch (e) {
      if (!isNetworkError(e)) {
        logger.error('Failed to upload profile link icon', {safeMessage: e})
      }
      return undefined
    }
  }
}
