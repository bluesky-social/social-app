import {useNavigationState} from '@react-navigation/native'

import {getTabState, TabState} from '#/lib/routes/helpers'

export function useNavigationTabState() {
  return useNavigationState(state => {
    const res = {
      isAtHome: getTabState(state, 'Home') !== TabState.Outside,
      isAtSearch: getTabState(state, 'Search') !== TabState.Outside,
      // FeedsTab no longer exists, but this check works for `Feeds` screen as well
      isAtFeeds: getTabState(state, 'Feeds') !== TabState.Outside,
      isAtNotifications:
        getTabState(state, 'Notifications') !== TabState.Outside,
      isAtMyProfile: getTabState(state, 'MyProfile') !== TabState.Outside,
      isAtMessages: getTabState(state, 'Messages') !== TabState.Outside,
    }

    if (
      !res.isAtHome &&
      !res.isAtSearch &&
      !res.isAtFeeds &&
      !res.isAtNotifications &&
      !res.isAtMyProfile &&
      !res.isAtMessages
    ) {
      // HACK for some reason useNavigationState will give us pre-hydration results
      //      and not update after, so we force isAtHome if all came back false
      //      -prf
      res.isAtHome = true
    }
    return res
  })
}
