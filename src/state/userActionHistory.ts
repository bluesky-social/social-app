import React from 'react'

const LIKE_WINDOW = 100
const FOLLOW_WINDOW = 100
const FOLLOW_SUGGESTION_WINDOW = 100
const SEEN_WINDOW = 100

export type SeenPost = {
  uri: string
  likeCount: number
  repostCount: number
  replyCount: number
  isFollowedBy: boolean
  feedContext: string | undefined
}

export type UserActionHistory = {
  /**
   * The last 100 post URIs the user has liked
   */
  likes: string[]
  /**
   * The last 100 DIDs the user has followed
   */
  follows: string[]
  /*
   * The last 100 DIDs of suggested follows based on last follows
   */
  followSuggestions: string[]
  /**
   * The last 100 post URIs the user has seen from the Discover feed only
   */
  seen: SeenPost[]
}

const userActionHistory: UserActionHistory = {
  likes: [],
  follows: [],
  followSuggestions: [],
  seen: [],
}

export function getActionHistory() {
  return userActionHistory
}

export function useActionHistorySnapshot() {
  return React.useState(() => getActionHistory())[0]
}

export function like(postUris: string[]) {
  userActionHistory.likes = userActionHistory.likes
    .concat(postUris)
    .slice(-LIKE_WINDOW)
}
export function unlike(postUris: string[]) {
  userActionHistory.likes = userActionHistory.likes.filter(
    uri => !postUris.includes(uri),
  )
}

export function follow(dids: string[]) {
  userActionHistory.follows = userActionHistory.follows
    .concat(dids)
    .slice(-FOLLOW_WINDOW)
}

export function followSuggestion(dids: string[]) {
  userActionHistory.followSuggestions = userActionHistory.followSuggestions
    .concat(dids)
    .slice(-FOLLOW_SUGGESTION_WINDOW)
}

export function unfollow(dids: string[]) {
  userActionHistory.follows = userActionHistory.follows.filter(
    uri => !dids.includes(uri),
  )
}

export function seen(posts: SeenPost[]) {
  userActionHistory.seen = userActionHistory.seen
    .concat(posts)
    .slice(-SEEN_WINDOW)
}
