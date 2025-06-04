import {AppBskyGraphVerification, AtUri} from '@atproto/api'
import {
  type VerificationState,
  type VerificationView,
} from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import * as bsky from '#/types/bsky'
import {type AnyProfileView} from '#/types/bsky/profile'
import {
  useBlackskyVerificationEnabled,
  useBlackskyVerificationTrusted,
} from '../preferences/blacksky-verification'
import {useConstellationInstance} from '../preferences/constellation-instance'
import {
  asUri,
  asyncGenCollect,
  asyncGenDedupe,
  asyncGenFilter,
  asyncGenTryMap,
  type ConstellationLink,
  constellationLinks,
} from './constellation'
import {LRU} from './direct-fetch-record'
import {resolvePdsServiceUrl} from './resolve-identity'
import {useCurrentAccountProfile} from './useCurrentAccountProfile'

const RQKEY_ROOT = 'blacksky-verification'
export const RQKEY = (did: string, trusted: Set<string>) => [
  RQKEY_ROOT,
  did,
  Array.from(trusted).sort(),
]

type LinkedRecord = {
  link: ConstellationLink
  record: AppBskyGraphVerification.Record
}

const verificationCache = new LRU<string, any>()

export function getTrustedConstellationVerifications(
  instance: string,
  did: string,
  trusted: Set<string>,
) {
  const urip = new AtUri(did)
  const verificationLinks = constellationLinks(instance, {
    target: urip.host,
    collection: 'app.bsky.graph.verification',
    path: '.subject',
    from_dids: Array.from(trusted),
  })
  return asyncGenDedupe(
    asyncGenFilter(verificationLinks, ({did}) => trusted.has(did)),
    ({did}) => did,
  )
}

async function getBlackskyVerificationLinkedRecords(
  instance: string,
  did: string,
  trusted: Set<string>,
): Promise<LinkedRecord[] | undefined> {
  try {
    const trustedVerificationLinks = getTrustedConstellationVerifications(
      instance,
      did,
      trusted,
    )

    const verificationRecords = asyncGenFilter(
      asyncGenTryMap<ConstellationLink, {link: ConstellationLink; record: any}>(
        trustedVerificationLinks,
        // using try map lets us:
        // - cache the service url and verificatin record in independent lrus
        // - clear the promise from the lru on failure
        // - skip links that cause errors
        async link => {
          const {did, rkey} = link

          let service = await resolvePdsServiceUrl(did)

          const request = `${service}/xrpc/com.atproto.repo.getRecord?repo=${did}&collection=app.bsky.graph.verification&rkey=${rkey}`
          const record = await verificationCache.getOrTryInsertWith(
            request,
            async () => {
              const resp = await (await fetch(request)).json()
              return resp.value
            },
          )
          return {link, record}
        },
        (_, e) => {
          console.error(e)
        },
      ),
      // the explicit return type shouldn't be needed...
      (d: {link: ConstellationLink; record: unknown}): d is LinkedRecord =>
        bsky.validate<AppBskyGraphVerification.Record>(
          d.record,
          AppBskyGraphVerification.validateRecord,
        ),
    )

    // Array.fromAsync will do this but not available everywhere yet
    return asyncGenCollect(verificationRecords)
  } catch (e) {
    console.error(e)
    return undefined
  }
}

function createVerificationViews(
  linkedRecords: LinkedRecord[],
  profile: AnyProfileView,
): VerificationView[] {
  return linkedRecords.map(({link, record}) => ({
    issuer: link.did,
    isValid:
      (profile.displayName ?? '') === record.displayName &&
      profile.handle === record.handle,
    createdAt: record.createdAt,
    uri: asUri(link),
  }))
}

function createVerificationState(
  verifications: VerificationView[],
  profile: AnyProfileView,
  trusted: Set<string>,
): VerificationState {
  return {
    verifications,
    verifiedStatus:
      verifications.length > 0
        ? verifications.findIndex(v => v.isValid) !== -1
          ? 'valid'
          : 'invalid'
        : 'none',
    trustedVerifierStatus: trusted.has(profile.did) ? 'valid' : 'none',
  }
}

export function useBlackskyVerificationState({
  profile,
  enabled,
}: {
  profile: AnyProfileView | undefined
  enabled?: boolean
}) {
  const instance = useConstellationInstance()
  const currentAccountProfile = useCurrentAccountProfile()
  const trusted = useBlackskyVerificationTrusted(currentAccountProfile?.did)

  const linkedRecords = useQuery<LinkedRecord[] | undefined>({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY(profile?.did || '', trusted),
    async queryFn() {
      if (!profile) return undefined

      return await getBlackskyVerificationLinkedRecords(
        instance,
        profile.did,
        trusted,
      )
    },
    enabled: enabled && profile !== undefined,
  })

  if (linkedRecords.data === undefined || profile === undefined) return
  const verifications = createVerificationViews(linkedRecords.data, profile)
  const verificationState = createVerificationState(
    verifications,
    profile,
    trusted,
  )

  return verificationState
}

export function useBlackskyVerificationProfileOverlay<V extends AnyProfileView>(
  profile: V,
): V {
  const enabled = useBlackskyVerificationEnabled()
  const verificationState = useBlackskyVerificationState({
    profile,
    enabled,
  })

  return enabled
    ? {
        ...profile,
        verification: verificationState,
      }
    : profile
}

export function useMaybeBlackskyVerificationProfileOverlay<
  V extends AnyProfileView,
>(profile: V | undefined): V | undefined {
  const enabled = useBlackskyVerificationEnabled()
  const verificationState = useBlackskyVerificationState({
    profile,
    enabled,
  })

  if (!profile) return undefined

  return enabled
    ? {
        ...profile,
        verification: verificationState,
      }
    : profile
}
