import React, {MutableRefObject} from 'react'
import {FlatList} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {Home} from './screens/Home'
import {Contacts} from './screens/Contacts'
import {Search} from './screens/Search'
import {Notifications} from './screens/Notifications'
import {NotFound} from './screens/NotFound'
import {PostThread} from './screens/PostThread'
import {PostUpvotedBy} from './screens/PostUpvotedBy'
import {PostDownvotedBy} from './screens/PostDownvotedBy'
import {PostRepostedBy} from './screens/PostRepostedBy'
import {Profile} from './screens/Profile'
import {ProfileFollowers} from './screens/ProfileFollowers'
import {ProfileFollows} from './screens/ProfileFollows'
import {ProfileMembers} from './screens/ProfileMembers'
import {Settings} from './screens/Settings'

export type ScreenParams = {
  params: Record<string, any>
  visible: boolean
  scrollElRef?: MutableRefObject<FlatList<any> | undefined>
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
  [Contacts, ['far', 'circle-user'], r('/contacts')],
  [Search, 'magnifying-glass', r('/search')],
  [Notifications, 'bell', r('/notifications')],
  [Settings, 'bell', r('/settings')],
  [Profile, ['far', 'user'], r('/profile/(?<name>[^/]+)')],
  [ProfileFollowers, 'users', r('/profile/(?<name>[^/]+)/followers')],
  [ProfileFollows, 'users', r('/profile/(?<name>[^/]+)/follows')],
  [ProfileMembers, 'users', r('/profile/(?<name>[^/]+)/members')],
  [
    PostThread,
    ['far', 'message'],
    r('/profile/(?<name>[^/]+)/post/(?<rkey>[^/]+)'),
  ],
  [
    PostUpvotedBy,
    'heart',
    r('/profile/(?<name>[^/]+)/post/(?<rkey>[^/]+)/upvoted-by'),
  ],
  [
    PostDownvotedBy,
    'heart',
    r('/profile/(?<name>[^/]+)/post/(?<rkey>[^/]+)/downvoted-by'),
  ],
  [
    PostRepostedBy,
    'retweet',
    r('/profile/(?<name>[^/]+)/post/(?<rkey>[^/]+)/reposted-by'),
  ],
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
