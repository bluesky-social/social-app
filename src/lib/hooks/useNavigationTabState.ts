import { TabState, getTabState } from "lib/routes/helpers";

import { useNavigationState } from "@react-navigation/native";

export function useNavigationTabState() {
  return useNavigationState((state) => {
    const res = {
      isAtHome: getTabState(state, "Home") !== TabState.Outside,
      isAtSearch: getTabState(state, "Search") !== TabState.Outside,
      isAtFeeds: getTabState(state, "Feeds") !== TabState.Outside,
      isAtNotifications:
        getTabState(state, "Notifications") !== TabState.Outside,
      isAtCommunities: getTabState(state, "Communities") !== TabState.Outside,
      isAtMyProfile: getTabState(state, "MyProfile") !== TabState.Outside,
    };
    if (
      !res.isAtHome &&
      !res.isAtSearch &&
      !res.isAtFeeds &&
      !res.isAtNotifications &&
      !res.isAtMyProfile
    ) {
      // HACK for some reason useNavigationState will give us pre-hydration results
      //      and not update after, so we force isAtHome if all came back false
      //      -prf
      res.isAtHome = true;
    }
    return res;
  });
}
