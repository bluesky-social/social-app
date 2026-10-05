import {type Events} from '#/analytics/metrics/types'

export type SharedNavTab =
  'Home' | 'Search' | 'Atmosphere' | 'Messages' | 'Notifications' | 'MyProfile'

export const TAB_TO_NAV_ITEM: Record<
  SharedNavTab,
  Events['nav:click']['item']
> = {
  Home: 'home',
  Search: 'search',
  Atmosphere: 'atmosphere',
  Messages: 'chat',
  Notifications: 'notifications',
  MyProfile: 'profile',
}
