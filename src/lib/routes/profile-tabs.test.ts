import {router} from '#/routes'
import {getProfileTabIndex} from './profile-tabs'

describe('getProfileTabIndex', () => {
  const indexes = {
    posts: 2,
    replies: 3,
    media: 4,
    videos: 5,
    feeds: 6,
    'starter-packs': 7,
    lists: 8,
  }

  it.each([
    ['posts', 2],
    ['replies', 3],
    ['media', 4],
    ['videos', 5],
    ['feeds', 6],
    ['starter-packs', 7],
    ['lists', 8],
  ])('resolves the %s tab', (tab, index) => {
    expect(getProfileTabIndex(tab, indexes, 0)).toBe(index)
  })

  it.each([undefined, '', 'unknown'])('defaults %s to posts', tab => {
    expect(getProfileTabIndex(tab, indexes, 2)).toBe(2)
  })

  it('defaults to posts when the requested tab is not available', () => {
    expect(getProfileTabIndex('replies', {posts: 2, replies: null}, 2)).toBe(2)
  })

  it('resolves a requested tab when it becomes available after placeholder data', () => {
    expect(getProfileTabIndex('feeds', {posts: 2, feeds: null}, 2)).toBe(2)
    expect(getProfileTabIndex('feeds', {posts: 2, feeds: 5}, 2)).toBe(5)
  })

  it('defaults inherited property names to posts', () => {
    expect(getProfileTabIndex('toString', indexes, 2)).toBe(2)
  })

  it.each([
    'posts',
    'replies',
    'media',
    'videos',
    'feeds',
    'starter-packs',
    'lists',
  ])('parses profile links with tab=%s', tab => {
    expect(router.matchPath(`/profile/alice.test?tab=${tab}`)).toEqual([
      'Profile',
      {name: 'alice.test', tab},
    ])
  })
})
