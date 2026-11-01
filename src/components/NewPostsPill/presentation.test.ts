import {
  newPostsPillLeadsUp,
  newPostsPillPresentation,
} from '#/components/NewPostsPill/presentation'

describe('newPostsPillPresentation', () => {
  it('shows faces only with four or more known posts and a usable avatar', () => {
    expect(
      newPostsPillPresentation({variant: 'newPosts', count: 4, faceCount: 3}),
    ).toBe('facepile')
    expect(
      newPostsPillPresentation({variant: 'newPosts', count: 3, faceCount: 3}),
    ).toBe('generic')
    expect(
      newPostsPillPresentation({variant: 'newPosts', count: 40, faceCount: 0}),
    ).toBe('generic')
    expect(
      newPostsPillPresentation({variant: 'newPosts', count: 0, faceCount: 0}),
    ).toBe('generic')
  })

  it('does not turn an existence-only check into a facepile', () => {
    expect(
      newPostsPillPresentation({
        variant: 'newPostsToFetch',
        count: 40,
        faceCount: 3,
      }),
    ).toBe('generic')
  })

  it('keeps notifications and plain scrolling distinct from post offers', () => {
    expect(
      newPostsPillPresentation({variant: 'new', count: 0, faceCount: 0}),
    ).toBe('new')
    expect(
      newPostsPillPresentation({
        variant: 'scrollToTop',
        count: 0,
        faceCount: 0,
      }),
    ).toBeNull()
  })
})

describe('newPostsPillLeadsUp', () => {
  it('points up by default for loaded posts and plain scrolling', () => {
    expect(newPostsPillLeadsUp('newPosts')).toBe(true)
    expect(newPostsPillLeadsUp('scrollToTop')).toBe(true)
    expect(newPostsPillLeadsUp('newPostsToFetch')).toBe(false)
    expect(newPostsPillLeadsUp('new')).toBe(false)
  })
})
