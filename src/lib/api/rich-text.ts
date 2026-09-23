import {type Client} from '@atproto/lex'
import {RichText} from '@bsky/sdk/richtext'

import {shortenLinks, stripInvalidMentions} from '#/lib/strings/rich-text-manip'

/**
 * Prepare user-entered post text for submission: trim leading
 * whitespace-only lines (without breaking ASCII art), trim trailing
 * whitespace, clean newlines, detect and resolve facets through the appview,
 * shorten links, and strip mentions that did not resolve to a DID.
 *
 * This is intentionally UI-free so every write path (the current composer
 * and the ComposerV2 planner) shares one normalization policy.
 */
export async function resolveRichText(
  appviewClient: Client,
  text: string,
): Promise<RichText> {
  const trimmedText = text
    // Trim leading whitespace-only lines (but don't break ASCII art).
    .replace(/^(\s*\n)+/, '')
    // Trim any trailing whitespace.
    .trimEnd()
  let rt = new RichText({text: trimmedText}, {cleanNewlines: true})
  await rt.detectFacets(appviewClient)

  rt = shortenLinks(rt)
  rt = stripInvalidMentions(rt)
  return rt
}
