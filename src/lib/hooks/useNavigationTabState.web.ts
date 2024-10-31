import {useNavigationState} from '@react-navigation/native'

import {getCurrentRoute} from '#/lib/routes/helpers'

export function useNavigationTabState() {
  return useNavigationState(state => {
    let currentRoute = state ? getCurrentRoute(state).name : 'Home'
    return {
      isAtHome: currentRoute === 'Home',
      isAtSearch: currentRoute === 'Search',
      isAtNotifications: currentRoute === 'Notifications',
      isAtMyProfile: currentRoute === 'MyProfile',
      isAtMessages: currentRoute === 'Messages',
    }
  })
}
