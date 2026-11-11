import {AtUri} from '@atproto/syntax'

import {IS_WEB} from '#/env'
import {type ActivityPresentationItem} from './presentation'
import {type ActivityActors} from './types'

export function isAtmosphereDebugEnabled() {
  return IS_WEB && hasAtmosphereDebugParam(window.location.search)
}

export function hasAtmosphereDebugParam(search: string) {
  return new URLSearchParams(search).has('debug')
}

/** Keeps the actual item/views/profiles, limiting the local index to reachable DIDs. */
export function createAtmosphereDebugItem(
  item: ActivityPresentationItem,
): ActivityPresentationItem {
  const dids = new Set<string>()
  function visit(value: unknown) {
    if (typeof value === 'string') {
      if (value.startsWith('did:')) dids.add(value)
      if (value.startsWith('at://')) {
        try {
          const did = new AtUri(value).host
          if (did.startsWith('did:')) dids.add(did)
        } catch {
          // Unknown extension payloads may contain strings that are not AT URIs.
        }
      }
    } else if (value && typeof value === 'object') {
      for (const child of Object.values(value)) visit(child)
    }
  }
  visit(item.type === 'activity' ? item.activity : item.group)
  if (item.type === 'group' && item.rawGroup) visit(item.rawGroup)
  const actors: ActivityActors = {}
  for (const did of dids) {
    const actor = item.actors[did]
    if (actor) actors[did] = actor
  }
  return {...item, actors}
}
