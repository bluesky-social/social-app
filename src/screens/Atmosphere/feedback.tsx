import {createContext, useContext} from 'react'
import {type AtUriString, parseAtUriString} from '@atproto/syntax'

import {type ActivityContent} from '#/screens/Atmosphere/ActivityTab/rows'
import {type UnspeccedInteractionPayload} from '#/features/feedFeedback'
import {type app, place, site, social} from '#/lexicons'

export type AtmosphereFeedback = (
  event: app.bsky.feed.defs.Interaction['event'],
  payload?: UnspeccedInteractionPayload,
) => void

const Context = createContext<AtmosphereFeedback | undefined>(undefined)
Context.displayName = 'AtmosphereFeedbackContext'

export const AtmosphereFeedbackProvider = Context.Provider

/** Undefined outside a recommended card, including ordinary post embeds. */
export function useAtmosphereFeedback() {
  return useContext(Context)
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
