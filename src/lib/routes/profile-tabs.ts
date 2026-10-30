export type ProfileTab =
  'posts' | 'replies' | 'media' | 'videos' | 'feeds' | 'starter-packs' | 'lists'

/** Resolve a profile tab index, falling back to the posts tab. */
export function getProfileTabIndex(
  tab: string | undefined,
  indexes: Partial<Record<ProfileTab, number | null>>,
  defaultIndex: number,
) {
  if (!tab || !Object.prototype.hasOwnProperty.call(indexes, tab)) {
    return defaultIndex
  }
  return indexes[tab as ProfileTab] ?? defaultIndex
}
