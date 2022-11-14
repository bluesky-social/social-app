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
export type Route = [React.FC<ScreenParams>, string, IconProp, RegExp]
export type MatchResult = {
  Com: React.FC<ScreenParams>
  defaultTitle: string
  icon: IconProp
  params: Record<string, any>
  isNotFound?: boolean
}

const r = (pattern: string) => new RegExp('^' + pattern + '([?]|$)', 'i')
export const routes: Route[] = [
  [Home, 'Home', 'house', r('/')],
  [Contacts, 'Contacts', ['far', 'circle-user'], r('/contacts')],
  [Search, 'Search', 'magnifying-glass', r('/search')],
  [Notifications, 'Notifications', 'bell', r('/notifications')],
  [Settings, 'Settings', 'bell', r('/settings')],
  [Profile, 'User', ['far', 'user'], r('/profile/(?<name>[^/]+)')],
  [
    ProfileFollowers,
    'Followers',
    'users',
    r('/profile/(?<name>[^/]+)/followers'),
  ],
  [ProfileFollows, 'Follows', 'users', r('/profile/(?<name>[^/]+)/follows')],
  [ProfileMembers, 'Members', 'users', r('/profile/(?<name>[^/]+)/members')],
  [
    PostThread,
    'Post',
    ['far', 'message'],
    r('/profile/(?<name>[^/]+)/post/(?<rkey>[^/]+)'),
  ],
  [
    PostUpvotedBy,
    'Upvoted by',
    'heart',
    r('/profile/(?<name>[^/]+)/post/(?<rkey>[^/]+)/upvoted-by'),
  ],
  [
    PostDownvotedBy,
    'Downvoted by',
    'heart',
    r('/profile/(?<name>[^/]+)/post/(?<rkey>[^/]+)/downvoted-by'),
  ],
  [
    PostRepostedBy,
    'Reposted by',
    'retweet',
    r('/profile/(?<name>[^/]+)/post/(?<rkey>[^/]+)/reposted-by'),
  ],
]

export function match(url: string): MatchResult {
  for (const [Com, defaultTitle, icon, pattern] of routes) {
    const res = pattern.exec(url)
    if (res) {
      // TODO: query params
      return {Com, defaultTitle, icon, params: res.groups || {}}
    }
  }
  return {
    Com: NotFound,
    defaultTitle: 'Not found',
    icon: 'magnifying-glass',
    params: {},
    isNotFound: true,
  }
}
