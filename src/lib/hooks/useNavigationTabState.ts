import {useNavigationState} from '@react-navigation/native'
import {getTabState, TabState} from 'lib/routes/helpers'

export function useNavigationTabState() {
  return useNavigationState(state => {
    return {
      isAtHome: getTabState(state, 'Home') !== TabState.Outside,
      isAtSearch: getTabState(state, 'Search') !== TabState.Outside,
      isAtNotifications:
        getTabState(state, 'Notifications') !== TabState.Outside,
    }
  })
}
