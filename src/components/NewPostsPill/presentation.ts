/** The content offered by a pill; the caller owns what pressing it does. */
export type NewPostsPillVariant =
  'newPosts' | 'newPostsToFetch' | 'new' | 'scrollToTop'

/** The usual arrow treatment. A surface may override it independently. */
export function newPostsPillLeadsUp(variant: NewPostsPillVariant): boolean {
  return variant === 'newPosts' || variant === 'scrollToTop'
}

/** A facepile needs a known group of posts and at least one usable avatar. */
export function newPostsPillPresentation({
  variant,
  count,
  faceCount,
}: {
  variant: NewPostsPillVariant
  count: number
  faceCount: number
}): 'generic' | 'facepile' | 'new' | null {
  switch (variant) {
    case 'scrollToTop':
      return null
    case 'new':
      return 'new'
    case 'newPostsToFetch':
      return 'generic'
    case 'newPosts':
      return count >= 4 && faceCount > 0 ? 'facepile' : 'generic'
  }
}
