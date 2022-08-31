import React from 'react'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
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
export type Route = [React.FC<ScreenParams>, IconProp, RegExp]
export type MatchResult = {
  Com: React.FC<ScreenParams>
  icon: IconProp
  params: Record<string, any>
}

const r = (pattern: string) => new RegExp('^' + pattern + '([?]|$)', 'i')
export const routes: Route[] = [
  [Home, 'house', r('/')],
  [Search, 'magnifying-glass', r('/search')],
  [Notifications, 'bell', r('/notifications')],
  [Profile, ['far', 'user'], r('/profile/(?<name>[^/]+)')],
  [ProfileFollowers, 'users', r('/profile/(?<name>[^/]+)/followers')],
  [ProfileFollows, 'users', r('/profile/(?<name>[^/]+)/follows')],
  [
    PostThread,
    ['far', 'message'],
    r('/profile/(?<name>[^/]+)/post/(?<recordKey>[^/]+)'),
  ],
  [
    PostLikedBy,
    'heart',
    r('/profile/(?<name>[^/]+)/post/(?<recordKey>[^/]+)/liked-by'),
  ],
  [
    PostRepostedBy,
    'retweet',
    r('/profile/(?<name>[^/]+)/post/(?<recordKey>[^/]+)/reposted-by'),
  ],
  [Composer, 'pen-nib', r('/compose')],
  [Login, ['far', 'user'], r('/login')],
  [Signup, ['far', 'user'], r('/signup')],
]

export function match(url: string): MatchResult {
  for (const [Com, icon, pattern] of routes) {
    const res = pattern.exec(url)
    if (res) {
      // TODO: query params
      return {Com, icon, params: res.groups || {}}
    }
  }
  return {Com: NotFound, icon: 'magnifying-glass', params: {}}
}
