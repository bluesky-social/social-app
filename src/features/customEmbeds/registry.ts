import {type AppBskyEmbedExternal} from '@atproto/api'

import {atmoRsvpHandler} from '#/features/customEmbeds/atmoRsvp'
import {type CustomEmbedHandler} from '#/features/customEmbeds/types'

/**
 * Ordered list of custom embed handlers. To add a new custom embed, implement a
 * handler in its own directory and append it here. The first handler whose
 * `match` returns true is used; otherwise upstream's default external embed
 * rendering takes over.
 */
const handlers: CustomEmbedHandler[] = [atmoRsvpHandler]

export function matchCustomEmbed(
  view: AppBskyEmbedExternal.ViewExternal,
): CustomEmbedHandler | null {
  return handlers.find(handler => handler.match(view)) ?? null
}
