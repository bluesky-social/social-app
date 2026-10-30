import {AtUri, type DidString, isValidDid} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient, useSession} from '#/state/session'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {getArticleExternalView} from './externalViews'
import {
  type ActivityActor,
  type ActivityActors,
  type ActivityItem,
  type AtmosphereActivityPage,
} from './types'

const useAtmosphereQueryRoot = 'useAtmosphereQuery'
const timeline = app.bsky.unspecced.getAtmosphereTimeline

export function useAtmosphereQuery() {
  const client = useAppviewClient()
  const {currentAccount} = useSession()
  const viewer = currentAccount?.did

  return useInfiniteQuery({
    queryKey: createQueryKey(useAtmosphereQueryRoot, {viewer}),
    enabled: !!viewer,
    queryFn: async ({pageParam}): Promise<AtmosphereActivityPage> => {
      const response = await client.call(timeline, {cursor: pageParam})
      const actors: ActivityActors = {}
      const ownerDids = new Set<DidString>()
      const addProfiles = (profiles?: ActivityActor[]) => {
        for (const profile of profiles ?? []) actors[profile.did] = profile
      }
      const visit = (activity: ActivityItem) => {
        const did = new AtUri(activity.record.uri).host
        if (isValidDid(did)) ownerDids.add(did)
        const view = activity.view
        if (bsky.isType(app.bsky.feed.defs.postView, view)) {
          addProfiles([view.author])
          addProfiles(getArticleExternalView(activity)?.associatedProfiles)
        } else if (bsky.isType(app.bsky.embed.external.viewArticle, view)) {
          addProfiles(view.associatedProfiles)
          addProfiles(view.likers)
          addProfiles(view.publisher?.associatedProfiles)
        } else if (
          bsky.isType(app.bsky.embed.external.viewArticlePublication, view)
        ) {
          addProfiles(view.associatedProfiles)
          addProfiles(view.subscribers)
        } else if (bsky.isType(app.bsky.embed.external.viewGallery, view)) {
          addProfiles(view.associatedProfiles)
          addProfiles(view.likers)
        } else if (bsky.isType(app.bsky.embed.external.viewLivestream, view)) {
          addProfiles(view.associatedProfiles)
        }
        for (const related of activity.relatedActivity ?? []) visit(related)
      }
      for (const entry of response.feed) {
        if (bsky.isType(timeline.activityItem, entry)) {
          visit(entry)
        } else if (bsky.isType(timeline.activityGroup, entry)) {
          if (entry.actor) ownerDids.add(entry.actor)
          for (const activity of entry.items) visit(activity)
        } else if (bsky.isType(timeline.activityItemOverflow, entry)) {
          addProfiles(entry.associatedProfiles)
        }
      }

      /* Target views need not include the recommender or subscriber's profile. */
      const missing = [...ownerDids].filter(did => !actors[did])
      for (let offset = 0; offset < missing.length; offset += 25) {
        const {profiles} = await client.call(app.bsky.actor.getProfiles, {
          actors: missing.slice(offset, offset + 25),
        })
        addProfiles(profiles)
      }
      return {...response, actors}
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.cursor,
    staleTime: STALE.SECONDS.FIFTEEN,
  })
}

/** Keeps activity actors in sync with optimistic account moderation changes. */
export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<ActivityActor, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AtmosphereActivityPage>
  >({
    queryKey: [useAtmosphereQueryRoot],
  })
  for (const [, data] of queryDatas) {
    for (const page of data?.pages ?? []) {
      const actor = page.actors[did]
      if (actor) yield actor
    }
  }
}
