import {type AppBskyActorProfile} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

/**
 * The `app.bsky.actor.profile` record, extended with the custom `featuredFeed`
 * field. The field holds the at-uri of a feed generator that the account wants
 * shown as the default tab when others visit their profile. It is not part of
 * the official lexicon, so the AppView's getProfile does not surface it - we
 * read it from the repo record directly.
 */
type ProfileRecordWithFeaturedFeed = AppBskyActorProfile.Record & {
  featuredFeed?: string
}

const RQKEY_ROOT = 'profile-record'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

/**
 * Reads the raw `app.bsky.actor.profile` record for an actor. Use this when you
 * need fields that the AppView does not return, such as `featuredFeed`.
 */
export function useProfileRecordQuery({
  did,
  enabled = true,
}: {
  did?: string
  enabled?: boolean
}) {
  const agent = useAgent()
  return useQuery({
    staleTime: STALE.MINUTES.FIVE,
    queryKey: RQKEY(did ?? ''),
    enabled: !!did && enabled,
    queryFn: async () => {
      try {
        const res = await agent.com.atproto.repo.getRecord({
          repo: did!,
          collection: 'app.bsky.actor.profile',
          rkey: 'self',
        })
        return res.data.value as ProfileRecordWithFeaturedFeed
      } catch {
        /*
         * The record may not exist (e.g. the account never set up a profile),
         * which getRecord surfaces as an error. Treat that as "no record".
         */
        return null
      }
    },
  })
}

/**
 * Returns the at-uri of the account's featured feed, or undefined if none is
 * set. Only feed-generator uris are returned.
 */
export function useFeaturedFeedUri({
  did,
  enabled = true,
}: {
  did?: string
  enabled?: boolean
}): string | undefined {
  const {data} = useProfileRecordQuery({did, enabled})
  const uri = data?.featuredFeed
  if (
    typeof uri === 'string' &&
    uri.startsWith('at://') &&
    uri.includes('app.bsky.feed.generator')
  ) {
    return uri
  }
  return undefined
}
