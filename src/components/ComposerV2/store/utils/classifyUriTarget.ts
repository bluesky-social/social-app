import {
  isBskyCustomFeedUrl,
  isBskyListUrl,
  isBskyPostUrl,
  isBskyStarterPackUrl,
  isBskyStartUrl,
} from '#/lib/strings/url-helpers'

export type AttachmentSlot = 'record' | 'media'

/**
 * Reserve the slot synchronously using the same record URL patterns as
 * resolveLink. A result for a different slot is rejected rather than moved
 * into a slot that may have acquired another attachment in the meantime.
 */
export function classifyUriTarget({uri}: {uri: string}): AttachmentSlot {
  if (
    isBskyPostUrl(uri) ||
    isBskyCustomFeedUrl(uri) ||
    isBskyListUrl(uri) ||
    isBskyStarterPackUrl(uri) ||
    isBskyStartUrl(uri)
  ) {
    return 'record'
  }
  return 'media'
}
