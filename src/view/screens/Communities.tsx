import {
  CommunitiesTabNavigatorParams,
  NativeStackScreenProps,
} from "lib/routes/types";
import { FlatList, View } from "react-native";
import { ViewSelector, ViewSelectorHandle } from "view/com/util/ViewSelector";

import { CommunityFeed } from "view/com/communities/CommunityFeed";
import { CommunityFeedModel } from "state/models/community-feed";
import { Feed } from "../com/notifications/Feed";
import { InvitedUsers } from "../com/notifications/InvitedUsers";
import { LoadLatestBtn } from "view/com/util/load-latest/LoadLatestBtn";
import React from "react";
import { ViewHeader } from "../com/util/ViewHeader";
import { isWeb } from "platform/detection";
import { observer } from "mobx-react-lite";
import { s } from "lib/styles";
import { useAnalytics } from "lib/analytics/analytics";
import { useFocusEffect } from "@react-navigation/native";
import { useOnMainScroll } from "lib/hooks/useOnMainScroll";
import { useStores } from "state/index";
import { useTabFocusEffect } from "lib/hooks/useTabFocusEffect";
import { withAuthRequired } from "view/com/auth/withAuthRequired";

type Props = NativeStackScreenProps<
  CommunitiesTabNavigatorParams,
  "Communities"
>;
export const CommunitiesScreen = withAuthRequired(
  observer(({}: Props) => {
    const store = useStores();
    const [onMainScroll, isScrolledDown, resetMainScroll] =
      useOnMainScroll(store);
    const scrollElRef = React.useRef<FlatList>(null);
    const { screen } = useAnalytics();
    const viewSelectorRef = React.useRef<ViewSelectorHandle>(null);
    const onSoftReset = React.useCallback(() => {
      viewSelectorRef.current?.scrollToTop();
    }, []);

    // event handlers
    // =
    const onPressTryAgain = React.useCallback(() => {
      store.me.notifications.refresh();
    }, [store]);

    const scrollToTop = React.useCallback(() => {
      scrollElRef.current?.scrollToOffset({ offset: 0 });
      resetMainScroll();
    }, [scrollElRef, resetMainScroll]);

    const onPressLoadLatest = React.useCallback(() => {
      scrollToTop();
      store.me.notifications.refresh();
    }, [store, scrollToTop]);

    // on-visible setup
    // =
    useFocusEffect(
      React.useCallback(() => {
        console.log("(usefocus)notifications call back 1");
        store.shell.setMinimalShellMode(false);
        store.log.debug("CommunitiesScreen: Updating communities");
        const softResetSub = store.onScreenSoftReset(onPressLoadLatest);
        store.me.notifications.update();
        screen("Communities");
        console.log("store comm:", store.me.mainFeed, store.me.savedFeeds);
        store.communities.fetch();
        // return () => {
        //   softResetSub.remove();
        //   store.me.notifications.markAllRead();
        // };
      }, [store, screen, onPressLoadLatest]),
    );
    useTabFocusEffect(
      "Communities",
      React.useCallback(
        (isInside) => {
          // on mobile:
          // fires with `isInside=true` when the user navigates to the root tab
          // but not when the user goes back to the screen by pressing back
          // on web:
          // essentially equivalent to useFocusEffect because we dont used tabbed
          // navigation
          if (isInside) {
            if (isWeb) {
              console.log("(web) notifications call back 2");
              // store.communities.fetch();
            } else {
              console.log("(notweb) notifications call back 3");
              // store.communities.fetch();
            }
          }
        },
        [store],
      ),
    );
    const renderItem = React.useCallback(
      (item: any) => {
        if (item instanceof CommunityFeedModel) {
          return <CommunityFeed item={item} />;
        }
        return <View />;
      },
      [onPressTryAgain, store.session.isDefaultSession],
    );

    // const hasNew =
    //   store.me.notifications.hasNewLatest &&
    //   !store.me.notifications.isRefreshing;
    return (
      <View testID="communitiesScreen" style={s.hContentRegion}>
        <ViewHeader title="Communities" canGoBack={false} />
        {/*TODO(viksit)[F1]: utilize a view system to make this look decent */}
        {/* {store.communities.communityFeeds?.map((item, index) => (
          <CommunityFeed item={item} />
        ))} */}
        {store.communities.communityFeeds && (
          <ViewSelector
            ref={viewSelectorRef}
            swipeEnabled={false}
            sections={[]}
            items={store.communities.communityFeeds}
            renderItem={renderItem}
          />
        )}
        {/* <Feed
          view={store.me.notifications}
          onPressTryAgain={onPressTryAgain}
          onScroll={onMainScroll}
          scrollElRef={scrollElRef}
        /> */}

        {/* {(isScrolledDown || hasNew) && (
          <LoadLatestBtn
            onPress={onPressLoadLatest}
            label="Load new notifications"
            showIndicator={hasNew}
            minimalShellMode={true}
          />
        )} */}
      </View>
    );
  }),
);
