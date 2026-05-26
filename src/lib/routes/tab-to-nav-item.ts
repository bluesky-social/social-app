export type SharedNavTab =
  | 'Home'
  | 'Search'
  | 'Messages'
  | 'Notifications'
  | 'MyProfile'

export const TAB_TO_NAV_ITEM: Record<
  SharedNavTab,
  'home' | 'search' | 'chat' | 'notifications' | 'profile'
> = {
  Home: 'home',
  Search: 'search',
  Messages: 'chat',
  Notifications: 'notifications',
  MyProfile: 'profile',
}
