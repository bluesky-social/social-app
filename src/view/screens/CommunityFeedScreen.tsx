import * as Toast from "view/com/util/Toast";

import {
  DropdownButton,
  DropdownItem,
} from "view/com/util/forms/DropdownButton";
import { FlatList, StyleSheet, View } from "react-native";
import { HeartIcon, HeartIconSolid } from "lib/icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SOLARPLEX_DID, SOLARPLEX_FEED_API } from "lib/constants";
import { colors, s } from "lib/styles";

import { Button } from "view/com/util/forms/Button";
import { CenteredView } from "view/com/util/Views";
import { CommonNavigatorParams } from "lib/routes/types";
import { CommunityFeedModel } from "state/models/feeds/community-feed";
import { CommunityHeader } from "view/com/profile/CommunityHeader";
import { ComposeIcon2 } from "lib/icons";
import { EmptyState } from "view/com/util/EmptyState";
import { FAB } from "../com/util/fab/FAB";
import { Feed } from "view/com/posts/Feed";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Haptics } from "lib/haptics";
import { LoadLatestBtn } from "view/com/util/load-latest/LoadLatestBtn";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PostsFeedModel } from "state/models/feeds/posts";
import { SolarplexCommunity } from "lib/splx-types";
import { Text } from "view/com/util/text/Text";
import { TextLink } from "view/com/util/Link";
import { UserAvatar } from "view/com/util/UserAvatar";
import { ViewHeader } from "view/com/util/ViewHeader";
import { ViewSelectorHandle } from "view/com/util/ViewSelector";
import { isDesktopWeb } from "platform/detection";
import { makeRecordUri } from "lib/strings/url-helpers";
import { observer } from "mobx-react-lite";
import { pluralize } from "lib/strings/helpers";
import { shareUrl } from "lib/sharing";
import { toShareUrl } from "lib/strings/url-helpers";
import { useAnalytics } from "lib/analytics/analytics";
import { useCustomFeed } from "lib/hooks/useCustomFeed";
import { useOnMainScroll } from "lib/hooks/useOnMainScroll";
import { usePalette } from "lib/hooks/usePalette";
import { useSetTitle } from "lib/hooks/useSetTitle";
import { useStores } from "state/index";
import { withAuthRequired } from "view/com/auth/withAuthRequired";

type Props = NativeStackScreenProps<CommonNavigatorParams, "CommunityFeed">;
export const CommunityFeedScreen = withAuthRequired(
  observer(({ route }: Props) => {
    const store = useStores();
    const pal = usePalette("default");
    const { screen, track } = useAnalytics();
    // const viewSelectorRef = React.useRef<ViewSelectorHandle>(null);
    // useEffect(() => {
    //   screen("Community");
    // }, [screen]);

    // name is community name
    // rkey is community id
    // all community feeds are by solarplex DID for now
    const { rkey, name } = route.params;

    const communityFeedModel = useMemo(() => {
      const model = new CommunityFeedModel(store, rkey);
      model.init(rkey);
      return model;
    }, [store, rkey]);

    const uri = useMemo(
      () => makeRecordUri(SOLARPLEX_DID, "app.bsky.feed.generator", rkey),
      [rkey, name],
    );
    const scrollElRef = useRef<FlatList>(null);
    const currentFeed = useCustomFeed(uri);

    const algoFeed: PostsFeedModel = useMemo(() => {
      const feed = new PostsFeedModel(store, "custom", {
        feed: uri,
      });
      feed.setup();
      return feed;
    }, [store, uri]);

    const [onMainScroll, isScrolledDown, resetMainScroll] =
      useOnMainScroll(store);

    useSetTitle(currentFeed?.displayName);

    const onPressShare = React.useCallback(() => {
      const url = toShareUrl(`/community/${rkey}`);
      shareUrl(url);
      track("CustomFeed:Share");
    }, [name, rkey, track]);

    const onScrollToTop = React.useCallback(() => {
      scrollElRef.current?.scrollToOffset({ offset: 0, animated: true });
      resetMainScroll();
    }, [scrollElRef, resetMainScroll]);

    const onPressCompose = React.useCallback(() => {
      store.shell.openComposer({});
    }, [store]);

    const dropdownItems: DropdownItem[] = React.useMemo(() => {
      let items: DropdownItem[] = [
        {
          testID: "feedHeaderDropdownShareBtn",
          label: "Share link",
          onPress: onPressShare,
        },
      ];
      return items;
    }, [onPressShare]);

    const renderHeaderBtns = React.useCallback(() => {
      return <></>;
    }, [pal, currentFeed?.isSaved, currentFeed?.isLiked, dropdownItems]);

    const renderListHeaderComponent = React.useCallback(() => {
      return (
        <>
          <View style={[styles.header, pal.border]}>
            <View style={s.flex1}>
              <Text
                testID="feedName"
                type="title-xl"
                style={[pal.text, s.bold]}
              >
                {currentFeed?.displayName}
              </Text>
              {currentFeed && (
                <Text type="md" style={[pal.textLight]} numberOfLines={1}>
                  by{" "}
                  {currentFeed.data.creator.did === store.me.did ? (
                    "you"
                  ) : (
                    <TextLink
                      text={`@${currentFeed.data.creator.handle}`}
                      href={`/profile/${currentFeed.data.creator.did}`}
                      style={[pal.textLight]}
                    />
                  )}
                </Text>
              )}
              {isDesktopWeb && !store.session.isSolarplexSession && (
                <View style={[styles.headerBtns, styles.headerBtnsDesktop]}>
                  <Button
                    type="default"
                    accessibilityLabel="Share this feed"
                    accessibilityHint=""
                    onPress={onPressShare}
                  >
                    <FontAwesomeIcon
                      icon="share"
                      size={18}
                      color={pal.colors.icon}
                    />
                  </Button>
                </View>
              )}
            </View>
            <View>
              <UserAvatar
                type="algo"
                avatar={currentFeed?.data.avatar}
                size={64}
              />
            </View>
          </View>
          <View style={styles.headerDetails}>
            {currentFeed?.data.description ? (
              <Text style={[pal.text, s.mb10]} numberOfLines={6}>
                {currentFeed.data.description}
              </Text>
            ) : null}
            <View style={styles.headerDetailsFooter}></View>
          </View>
          <View style={[styles.fakeSelector, pal.border]}>
            <View
              style={[
                styles.fakeSelectorItem,
                { borderColor: pal.colors.link },
              ]}
            >
              <Text type="md-medium" style={[pal.text]}>
                Feed
              </Text>
            </View>
          </View>
        </>
      );
    }, [
      pal,
      currentFeed,
      store.me.did,
      onPressShare,
      name,
      rkey,
      store.session.isSolarplexSession,
    ]);

    const renderEmptyState = React.useCallback(() => {
      return <EmptyState icon="feed" message="This list is empty!" />;
    }, []);

    const onRefresh = React.useCallback(() => {
      // uiState
      //   .refresh()
      //   .catch((err: any) =>
      //     store.log.error("Failed to refresh user profile", err),
      //   );
    }, [
      //uiState,
      store,
    ]);
    // TODO(viksit): downstream needs isPinned otherwise it prompts an error
    const isPinned = false;
    return (
      <View style={s.hContentRegion}>
        {!store.session.isSolarplexSession &&
          communityFeedModel &&
          communityFeedModel.hasLoaded && (
            <>
              {/* <ViewHeader
                title=""
                renderButton={currentFeed && renderHeaderBtns}
              /> */}
              <CenteredView>
                <CommunityHeader
                  view={communityFeedModel}
                  onRefreshAll={onRefresh}
                />
              </CenteredView>
            </>
          )}

        <Feed
          scrollElRef={scrollElRef}
          feed={algoFeed}
          onScroll={onMainScroll}
          scrollEventThrottle={100}
          //ListHeaderComponent={renderListHeaderComponent}
          renderEmptyState={renderEmptyState}
          extraData={[uri, isPinned, true]}
        />
        {isScrolledDown ? (
          <LoadLatestBtn
            onPress={onScrollToTop}
            label="Scroll to top"
            showIndicator={false}
          />
        ) : null}
        {!store.session.isSolarplexSession && (
          <FAB
            testID="composeFAB"
            onPress={onPressCompose}
            icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
            accessibilityRole="button"
            accessibilityLabel="Compose post"
            accessibilityHint=""
          />
        )}
      </View>
    );
  }),
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  headerBtns: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtnsDesktop: {
    marginTop: 8,
    gap: 4,
  },
  headerAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 4,
  },
  headerDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerDetailsFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fakeSelector: {
    flexDirection: "row",
    paddingHorizontal: isDesktopWeb ? 16 : 6,
  },
  fakeSelectorItem: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 3,
  },
  liked: {
    color: colors.red3,
  },
  top1: {
    position: "relative",
    top: 1,
  },
  top2: {
    position: "relative",
    top: 2,
  },
});
