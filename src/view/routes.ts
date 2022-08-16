import React from 'react'
import {Home} from './screens/Home'
import {Search} from './screens/Search'
import {Notifications} from './screens/Notifications'
import {Login} from './screens/Login'
import {Signup} from './screens/Signup'
import {NotFound} from './screens/NotFound'
import {Composer} from './screens/Composer'
import {PostThread} from './screens/PostThread'
import {PostLikedBy} from './screens/PostLikedBy'
import {PostRepostedBy} from './screens/PostRepostedBy'
import {Profile} from './screens/Profile'
import {ProfileFollowers} from './screens/ProfileFollowers'
import {ProfileFollows} from './screens/ProfileFollows'

export type ScreenParams = {
  params: Record<string, any>
}

const r = (pattern: string) => new RegExp('^' + pattern + '([?]|$)', 'i')

type Route = [React.FC<ScreenParams>, RegExp]
export const routes: Route[] = [
  [Home, r('/')],
  [Search, r('/search')],
  [Notifications, r('/notifications')],
  [Profile, r('/profile/(?<name>[^/]+)')],
  [ProfileFollowers, r('/profile/(?<name>[^/]+)/followers')],
  [ProfileFollows, r('/profile/(?<name>[^/]+)/follows')],
  [PostThread, r('/profile/(?<name>[^/]+)/post/(?<recordKey>[^/]+)')],
  [PostLikedBy, r('/profile/(?<name>[^/]+)/post/(?<recordKey>[^/]+)/liked-by')],
  [
    PostRepostedBy,
    r('/profile/(?<name>[^/]+)/post/(?<recordKey>[^/]+)/reposted-by'),
  ],
  [Composer, r('/compose')],
  [Login, r('/login')],
  [Signup, r('/signup')],
]

export type MatchResult = {
  Com: React.FC<ScreenParams>
  params: Record<string, any>
}
export function match(url: string): MatchResult {
  for (const [Com, pattern] of routes) {
    const res = pattern.exec(url)
    if (res) {
      // TODO: query params
      return {Com, params: res.groups || {}}
    }
  }
  return {Com: NotFound, params: {}}
}
