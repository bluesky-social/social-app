import {
  ActivityIndicator,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import React, { MutableRefObject } from "react";

import { CustomFeedModel } from "state/models/feeds/custom-feed";
import { ErrorMessage } from "../util/error/ErrorMessage";
import { FeedSlice } from "./FeedSlice";
import { FlatList } from "../util/Views";
import { LoadMoreRetryBtn } from "../util/LoadMoreRetryBtn";
import { OnScrollCb } from "lib/hooks/useOnMainScroll";
import { PostFeedLoadingPlaceholder } from "../util/LoadingPlaceholder";
import { PostsFeedModel } from "state/models/feeds/posts";
import { SOLARPLEX_DID } from "lib/constants";
import { TabBarCustomFeed } from "../pager/TabBarCustomFeed";
import { faL } from "@fortawesome/free-solid-svg-icons";
import { observer } from "mobx-react-lite";
import { s } from "lib/styles";
import { useAnalytics } from "lib/analytics/analytics";
import { useCustomFeed } from "lib/hooks/useCustomFeed";
import { usePalette } from "lib/hooks/usePalette";
import { useTheme } from "lib/ThemeContext";

const LOADING_ITEM = { _reactKey: "__loading__" };
const EMPTY_FEED_ITEM = { _reactKey: "__empty__" };
const ERROR_ITEM = { _reactKey: "__error__" };
const LOAD_MORE_ERROR_ITEM = { _reactKey: "__load_more_error__" };

export const Feed = observer(function Feed({
  feed,
  style,
  showPostFollowBtn,
  scrollElRef,
  onPressTryAgain,
  onScroll,
  scrollEventThrottle,
  renderEmptyState,
  testID,
  headerOffset = 0,
  ListHeaderComponent,
  extraData,
}: {
  feed: PostsFeedModel;
  style?: StyleProp<ViewStyle>;
  showPostFollowBtn?: boolean;
  scrollElRef?: MutableRefObject<FlatList<any> | null>;
  onPressTryAgain?: () => void;
  onScroll?: OnScrollCb;
  scrollEventThrottle?: number;
  renderEmptyState?: () => JSX.Element;
  testID?: string;
  headerOffset?: number;
  ListHeaderComponent?: () => JSX.Element;
  extraData?: any;
}) {
  const pal = usePalette("default");
  const theme = useTheme();
  const { track } = useAnalytics();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const data = React.useMemo(() => {
    let feedItems: any[] = [];
    if (feed.hasLoaded) {
      if (feed.hasError) {
        feedItems = feedItems.concat([ERROR_ITEM]);
      }
      if (feed.isEmpty) {
        feedItems = feedItems.concat([EMPTY_FEED_ITEM]);
      } else {
        feedItems = feedItems.concat(feed.slices);
      }
      if (feed.loadMoreError) {
        feedItems = feedItems.concat([LOAD_MORE_ERROR_ITEM]);
      }
    } else if (feed.isLoading) {
      feedItems = feedItems.concat([LOADING_ITEM]);
    } else {
      feed.retryLoadMore();
    }
    return feedItems;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    feed.hasError,
    feed.hasLoaded,
    feed.isLoading,
    feed.isEmpty,
    feed.slices,
    feed.loadMoreError,
  ]);

  // events
  // =

  const onRefresh = React.useCallback(async () => {
    track("Feed:onRefresh");
    setIsRefreshing(true);
    try {
      await feed.refresh();
    } catch (err) {
      feed.rootStore.log.error("Failed to refresh posts feed", err);
    }
    setIsRefreshing(false);
  }, [feed, track, setIsRefreshing]);

  const onEndReached = React.useCallback(async () => {
    track("Feed:onEndReached");
    try {
      await feed.loadMore();
    } catch (err) {
      feed.rootStore.log.error("Failed to load more posts", err);
    }
  }, [feed, track]);

  const onPressRetryLoadMore = React.useCallback(() => {
    feed.retryLoadMore();
  }, [feed]);

  // rendering
  // =
  const currentFeed = useCustomFeed(
    `at://${SOLARPLEX_DID}/app.bsky.feed.generator/splx-solana`,
  );

  const renderItem = React.useCallback(
    ({ item }: { item: any }) => {
      if (item === EMPTY_FEED_ITEM) {
        if (renderEmptyState) {
          return renderEmptyState();
        }
        return <View />;
      } else if (item === ERROR_ITEM) {
        return (
          <ErrorMessage
            message={feed.error}
            onPressTryAgain={onPressTryAgain}
          />
        );
      } else if (item === LOAD_MORE_ERROR_ITEM) {
        return (
          <LoadMoreRetryBtn
            label="There was an issue fetching posts. Tap here to try again."
            onPress={onPressRetryLoadMore}
          />
        );
      } else if (item === LOADING_ITEM) {
        return <PostFeedLoadingPlaceholder />;
      }
      return (
        <>
          <FeedSlice
            slice={item}
            showFollowBtn={showPostFollowBtn}
            hideChild={extraData?.length > 1 ? extraData[2] : false}
          />
        </>
      );
    },
    [
      feed,
      onPressTryAgain,
      onPressRetryLoadMore,
      showPostFollowBtn,
      renderEmptyState,
    ],
  );

  const FeedFooter = React.useCallback(
    () =>
      feed.isLoading ? (
        <View style={styles.feedFooter}>
          <ActivityIndicator />
        </View>
      ) : (
        <View />
      ),
    [feed],
  );

  return (
    <View testID={testID} style={style}>
      {data.length > 0 && (
        <>
          {/* {currentFeed && (
            <FlatList
              data={data}
              renderItem={tabrenderItem({
                item: currentFeed,
              })}
              contentContainerStyle={s.contentContainer}
              style={{paddingTop: headerOffset}}
              onScroll={onScroll}
              scrollEventThrottle={scrollEventThrottle}
              indicatorStyle={theme.colorScheme === 'dark' ? 'white' : 'black'}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.6}
              removeClippedSubviews={true}
              contentOffset={{x: 0, y: headerOffset * -1}}
              extraData={extraData}
            />
          )} */}
          <FlatList
            testID={testID ? `${testID}-flatlist` : undefined}
            ref={scrollElRef}
            data={data}
            keyExtractor={(item) => item._reactKey}
            renderItem={renderItem}
            ListFooterComponent={FeedFooter}
            ListHeaderComponent={ListHeaderComponent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={pal.colors.text}
                titleColor={pal.colors.text}
                progressViewOffset={headerOffset}
              />
            }
            contentContainerStyle={s.contentContainer}
            style={{ paddingTop: headerOffset }}
            onScroll={onScroll}
            scrollEventThrottle={scrollEventThrottle}
            indicatorStyle={theme.colorScheme === "dark" ? "white" : "black"}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.6}
            removeClippedSubviews={true}
            contentOffset={{ x: 0, y: headerOffset * -1 }}
            extraData={extraData}
            // @ts-ignore our .web version only -prf
            desktopFixedHeight
          />
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  feedFooter: { paddingTop: 20 },
});
