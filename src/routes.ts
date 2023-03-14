import {Router} from 'lib/routes/router'

export const router = new Router({
  Home: '/',
  Search: '/search',
  Notifications: '/notifications',
  Settings: '/settings',
  Profile: '/profile/:name',
  ProfileFollowers: '/profile/:name/followers',
  ProfileFollows: '/profile/:name/follows',
  PostThread: '/profile/:name/post/:rkey',
  PostUpvotedBy: '/profile/:name/post/:rkey/upvoted-by',
  PostRepostedBy: '/profile/:name/post/:rkey/reposted-by',
  Debug: '/sys/debug',
  Log: '/sys/log',
  Support: '/support',
  PrivacyPolicy: '/support/privacy',
})
