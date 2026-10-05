import {type ProfileLink} from './types'

export const GERM_KEY = 'germ'

export type ProfileRowItem =
  | {type: 'germ'; key: typeof GERM_KEY}
  | {type: 'link'; key: string; link: ProfileLink}

/**
 * The profile's row in display order: the links, with the Germ DM button
 * slotted in at its saved position when the account has one.
 */
export function buildProfileRow(
  links: ProfileLink[],
  hasGerm: boolean,
  germIndex: number,
): ProfileRowItem[] {
  const items: ProfileRowItem[] = links.map(link => ({
    type: 'link',
    key: link.url,
    link,
  }))
  if (hasGerm) {
    const at = Math.max(0, Math.min(germIndex, items.length))
    items.splice(at, 0, {type: 'germ', key: GERM_KEY})
  }
  return items
}

/**
 * Applies a reordered row of keys. Without a Germ button in the row, the
 * saved Germ position is left alone.
 */
export function applyRowOrder(
  keys: string[],
  links: ProfileLink[],
  germIndex: number,
): {links: ProfileLink[]; germIndex: number} {
  const byUrl = new Map(links.map(link => [link.url, link]))
  const next = keys.flatMap(key => {
    const link = byUrl.get(key)
    return link ? [link] : []
  })
  const at = keys.indexOf(GERM_KEY)
  return {links: next, germIndex: at >= 0 ? at : germIndex}
}

/**
 * Removes a link, keeping the Germ button in the same place relative to the
 * links around it.
 */
export function removeLinkAt(
  links: ProfileLink[],
  germIndex: number,
  index: number,
): {links: ProfileLink[]; germIndex: number} {
  return {
    links: links.filter((_, i) => i !== index),
    germIndex: index < germIndex ? germIndex - 1 : germIndex,
  }
}
