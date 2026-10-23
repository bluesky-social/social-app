import {getBlobCidString} from '@atproto/lex'

import {type ProfileLink} from './types'

function faviconUrl(
  url: string | undefined,
  blob: ProfileLink['icon'],
  did: string | undefined,
): string | undefined {
  if (url) return url
  if (!blob || !did) return undefined
  return `https://cdn.bsky.app/img/avatar_thumbnail/plain/${did}/${getBlobCidString(blob)}@png`
}

/**
 * Where a link's favicon loads from, using its dark variant in a dark color
 * scheme when it has one. Profile views give the URL; links read from the
 * owner's repo only have the blob, which the image CDN serves like an avatar.
 * PNG keeps the transparency most favicons rely on.
 */
export function linkFaviconUrl(
  link: ProfileLink,
  did: string | undefined,
  dark = false,
): string | undefined {
  return (
    (dark ? faviconUrl(link.iconDarkUrl, link.iconDark, did) : undefined) ??
    faviconUrl(link.iconUrl, link.icon, did)
  )
}
