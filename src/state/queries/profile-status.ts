import {XRPCError} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'
import {BLACKSKY_LABELER} from '#/state/session/additional-moderation-authorities'

export const BLUESKY_MOD_DID = 'did:plc:ar7c4by46qjdydhdevvrndac'
export const BLUESKY_MOD_EMAIL = 'moderation@blueskyweb.xyz'

export const BLACKSKY_MOD_DID = BLACKSKY_LABELER
export const BLACKSKY_MOD_APPEAL_URL =
  'https://blackskyweb.xyz/about/support/moderation-appeal/'

export type ProfileErrorKind =
  | 'deactivated'
  | 'suspendedOrTakedown'
  | 'notFound'
  | 'unknown'

const SUSPEND_LABEL_VALUES = new Set(['!takedown', '!suspend'])
const KNOWN_MOD_DIDS = [BLUESKY_MOD_DID, BLACKSKY_MOD_DID]

export function classifyProfileError(error: unknown): ProfileErrorKind {
  if (!error) return 'unknown'

  let code: string | undefined
  let msg = ''
  if (error instanceof XRPCError) {
    code = error.error
    msg = (error.message || '').toLowerCase()
  } else if (error instanceof Error) {
    msg = error.message.toLowerCase()
  } else {
    msg = String(error).toLowerCase()
  }

  if (code === 'AccountDeactivated' || msg.includes('deactivated')) {
    return 'deactivated'
  }
  if (
    code === 'AccountTakedown' ||
    code === 'AccountSuspended' ||
    msg.includes('suspended') ||
    msg.includes('taken down')
  ) {
    return 'suspendedOrTakedown'
  }
  if (
    code === 'ActorNotFound' ||
    msg.includes('not found') ||
    msg.includes('could not find') ||
    msg.includes('could not locate') ||
    msg.includes('unable to resolve handle')
  ) {
    return 'notFound'
  }
  return 'unknown'
}

export type ProfileStatusSource = {
  src: string
  handle: string
  email: string
  appealUrl?: string
}

export const RQKEY_STATUS_SOURCE = (did: string) => [
  'profile-status-source',
  did,
]

export function useProfileStatusSource(
  did: string | undefined,
  {enabled = true}: {enabled?: boolean} = {},
) {
  const agent = useAgent()
  return useQuery<ProfileStatusSource | null>({
    queryKey: RQKEY_STATUS_SOURCE(did ?? ''),
    staleTime: STALE.MINUTES.FIVE,
    retry: false,
    enabled: !!did && enabled,
    queryFn: async () => {
      if (!did) return null

      const labelsRes = await agent.com.atproto.label.queryLabels({
        uriPatterns: [did],
        sources: KNOWN_MOD_DIDS,
      })

      const label = labelsRes.data.labels.find(
        l => !l.neg && SUSPEND_LABEL_VALUES.has(l.val),
      )
      if (!label) return null

      const src = label.src
      let email = ''
      let appealUrl: string | undefined
      if (src === BLACKSKY_MOD_DID) {
        appealUrl = BLACKSKY_MOD_APPEAL_URL
      } else if (src === BLUESKY_MOD_DID) {
        email = BLUESKY_MOD_EMAIL
      }

      let handle = src
      try {
        const profileRes = await agent.app.bsky.actor.getProfile({actor: src})
        handle = profileRes.data.handle || src
      } catch {
        // Best-effort: fall back to the DID if the labeler profile can't be
        // resolved on our AppView.
      }

      return {src, handle, email, appealUrl}
    },
  })
}
