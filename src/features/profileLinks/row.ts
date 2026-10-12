import {type ProfileLink} from './types'

export const GERM_KEY = 'germ'

export type ProfileRowItem =
  | {type: 'germ'; key: typeof GERM_KEY}
  | {type: 'link'; key: string; link: ProfileLink}

/**
 * The profile's row in display order: the links, then the Germ DM button when
 * the account has one.
 */
export function buildProfileRow(
  links: ProfileLink[],
  hasGerm: boolean,
): ProfileRowItem[] {
  const items: ProfileRowItem[] = links.map(link => ({
    type: 'link',
    key: link.url,
    link,
  }))
  if (hasGerm) items.push({type: 'germ', key: GERM_KEY})
  return items
}

/** Applies a reordered list of keys (link URLs) to the links. */
export function reorderLinks(
  keys: string[],
  links: ProfileLink[],
): ProfileLink[] {
  const byUrl = new Map(links.map(link => [link.url, link]))
  return keys.flatMap(key => {
    const link = byUrl.get(key)
    return link ? [link] : []
  })
}
