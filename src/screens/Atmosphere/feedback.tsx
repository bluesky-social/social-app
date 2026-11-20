import {createContext, useContext, useEffect, useRef} from 'react'
import {type AtUriString, parseAtUriString} from '@atproto/syntax'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useSession} from '#/state/session'
import {type ActivityContent} from '#/screens/Atmosphere/ActivityTab/rows'
import {DISCOVER_FEEDBACK} from '#/screens/Atmosphere/const'
import {type ForYouItem} from '#/screens/Atmosphere/ForYouTab/useAtmosphereRecommendedActivityQuery'
import {useAtmosphereIsActive} from '#/screens/Atmosphere/metrics/context'
import {
  type UnspeccedInteractionPayload,
  useFeedFeedbackCore,
} from '#/features/feedFeedback'
import {type app, place, site, social} from '#/lexicons'

export type AtmosphereFeedback = (
  event: app.bsky.feed.defs.Interaction['event'],
  payload?: UnspeccedInteractionPayload,
) => void

export type AtmosphereFeedbackForContent = (
  content: ActivityContent,
) => AtmosphereFeedback | undefined

const Context = createContext<AtmosphereFeedback | undefined>(undefined)
Context.displayName = 'AtmosphereFeedbackContext'

export const AtmosphereFeedbackProvider = Context.Provider

/** Undefined outside a recommended card, including ordinary post embeds. */
export function useAtmosphereFeedback() {
  return useContext(Context)
}

/**
 * Adapts For You's non-post rows to the shared feedback sender, which has no
 * knowledge of list visibility or moderation. Unlike content analytics, feed
 * impressions are deduplicated per record and recommendation request. Stale
 * or blurred rows are ignored, and inactive impressions wait for activation.
 */
export function useForYouFeedback(
  data: {items: ForYouItem[]; recIdStr: string} | undefined,
) {
  const {hasSession} = useSession()
  const isActive = useAtmosphereIsActive()
  const {enabled, sendInteraction} = useFeedFeedbackCore({
    ...DISCOVER_FEEDBACK,
    enabled: hasSession && !!data?.recIdStr,
    viewContext: 'feed',
  })
  const seen = useRef(new Set<string>())
  const pending = useRef(new Map<ForYouItem, number>())
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const forItem = (item: ForYouItem): AtmosphereFeedback | undefined => {
    const uri = getAtmosphereFeedbackUri(item.content)
    if (!enabled || !item.reqId || !uri) return
    return (event, payload) =>
      sendInteraction({
        item: uri,
        event,
        reqId: item.reqId,
        ...(payload ? {payload} : {}),
      })
  }

  const onItemSeen = useNonReactiveCallback(
    (item: ForYouItem, position: number | undefined) => {
      if (
        !mounted.current ||
        position == null ||
        data?.items[position] !== item ||
        item.moderation.blur
      ) {
        return
      }
      const send = forItem(item)
      const uri = getAtmosphereFeedbackUri(item.content)
      if (!send || !uri) return
      const key = `${item.reqId}:${uri}`
      if (seen.current.has(key)) return
      if (!isActive) {
        pending.current.set(item, position)
        return
      }
      seen.current.add(key)
      send('app.bsky.feed.defs#interactionSeen')
    },
  )
  useEffect(() => {
    for (const [item, position] of pending.current) {
      if (data?.items[position] !== item) {
        pending.current.delete(item)
      } else if (isActive && enabled) {
        onItemSeen(item, position)
        pending.current.delete(item)
      }
    }
  }, [isActive, enabled, data, onItemSeen])

  return {forItem, onItemSeen}
}

/** Curated sections omit a recommendation ID and do not accept feedback. */
export function useExploreFeedback(
  destination: {feedUri: string | undefined; feedDid: string},
  reqId: string | undefined,
): AtmosphereFeedbackForContent {
  const {hasSession} = useSession()
  const {enabled, sendInteraction} = useFeedFeedbackCore({
    ...destination,
    enabled: hasSession && !!reqId,
    viewContext: 'feed',
  })
  return content => {
    if (!enabled || !reqId) return
    const uri = getAtmosphereFeedbackUri(content)
    if (!uri) return
    return (event, payload) =>
      sendInteraction({
        item: uri,
        event,
        reqId,
        ...(payload ? {payload} : {}),
      })
  }
}

/** External URLs are presentation identities, not feedback record identities. */
export function getAtmosphereFeedbackUri({type, view}: ActivityContent) {
  const collection = {
    article: site.standard.document.$type,
    publication: site.standard.publication.$type,
    gallery: social.grain.gallery.$type,
    livestream: place.stream.livestream.$type,
  }[type]
  const records = new Set<AtUriString>()
  for (const {uri} of view.associatedRefs ?? []) {
    const parsed = parseAtUriString(uri)
    if (
      parsed.success &&
      parsed.value.collection === collection &&
      parsed.value.rkey &&
      !parsed.value.query &&
      !parsed.value.hash
    ) {
      records.add(uri)
    }
  }
  // Multiple source records can hydrate to the same URL; don't guess a target.
  return records.size === 1 ? records.values().next().value : undefined
}
