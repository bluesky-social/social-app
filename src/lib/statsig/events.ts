export type LogEvents = {
  init: {
    initMs: number
  }
  'account:loggedIn': {
    logContext: 'LoginForm' | 'SwitchAccount' | 'ChooseAccountForm' | 'Settings'
    withPassword: boolean
  }
  'account:loggedOut': {
    logContext: 'SwitchAccount' | 'Settings' | 'Deactivated'
  }
  'notifications:openApp': {}
  'state:background': {
    secondsActive: number
  }
  'state:foreground': {}
  'feed:endReached': {
    feedType: string
    itemCount: number
  }
  'feed:refresh': {
    feedType: string
    reason: 'pull-to-refresh' | 'soft-reset' | 'load-latest'
  }
  'post:create': {
    imageCount: number
    isReply: boolean
    hasLink: boolean
    hasQuote: boolean
    langs: string
    logContext: 'Composer'
  }
  'post:like': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
  'post:repost': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
  'post:unlike': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
  'post:unrepost': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
  'profile:follow': {
    logContext:
      | 'RecommendedFollowsItem'
      | 'PostThreadItem'
      | 'ProfileCard'
      | 'ProfileHeader'
      | 'ProfileHeaderSuggestedFollows'
      | 'ProfileMenu'
  }
  'profile:unfollow': {
    logContext:
      | 'RecommendedFollowsItem'
      | 'PostThreadItem'
      | 'ProfileCard'
      | 'ProfileHeader'
      | 'ProfileHeaderSuggestedFollows'
      | 'ProfileMenu'
  }
}
