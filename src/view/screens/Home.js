var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PROD_DEFAULT_FEED } from '#/lib/constants';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { useOTAUpdates } from '#/lib/hooks/useOTAUpdates';
import { useSetTitle } from '#/lib/hooks/useSetTitle';
import { useRequestNotificationsPermission } from '#/lib/notifications/notifications';
import { emitSoftReset } from '#/state/events';
import { usePinnedFeedsInfos, } from '#/state/queries/feed';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useSession } from '#/state/session';
import { useSetMinimalShellMode } from '#/state/shell';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { useSelectedFeed, useSetSelectedFeed } from '#/state/shell/selected-feed';
import { FeedPage } from '#/view/com/feeds/FeedPage';
import { HomeHeader } from '#/view/com/home/HomeHeader';
import { Pager, } from '#/view/com/pager/Pager';
import { CustomFeedEmptyState } from '#/view/com/posts/CustomFeedEmptyState';
import { FollowingEmptyState } from '#/view/com/posts/FollowingEmptyState';
import { FollowingEndOfFeed } from '#/view/com/posts/FollowingEndOfFeed';
import { NoFeedsPinned } from '#/screens/Home/NoFeedsPinned';
import * as Layout from '#/components/Layout';
import { useAnalytics } from '#/analytics';
import { IS_LIQUID_GLASS, IS_WEB } from '#/env';
import { useDemoMode } from '#/storage/hooks/demo-mode';
export function HomeScreen(props) {
    var setShowLoggedOut = useLoggedOutViewControls().setShowLoggedOut;
    var preferences = usePreferencesQuery().data;
    var currentAccount = useSession().currentAccount;
    var _a = usePinnedFeedsInfos(), pinnedFeedInfos = _a.data, isPinnedFeedsLoading = _a.isLoading;
    React.useEffect(function () {
        if (IS_WEB && !currentAccount) {
            var getParams = new URLSearchParams(window.location.search);
            var splash = getParams.get('splash');
            if (splash === 'true') {
                setShowLoggedOut(true);
                return;
            }
        }
        var params = props.route.params;
        if (currentAccount &&
            props.route.name === 'Start' &&
            (params === null || params === void 0 ? void 0 : params.name) &&
            (params === null || params === void 0 ? void 0 : params.rkey)) {
            props.navigation.navigate('StarterPack', {
                rkey: params.rkey,
                name: params.name,
            });
        }
    }, [
        currentAccount,
        props.navigation,
        props.route.name,
        props.route.params,
        setShowLoggedOut,
    ]);
    if (preferences && pinnedFeedInfos && !isPinnedFeedsLoading) {
        return (_jsx(Layout.Screen, { testID: "HomeScreen", noInsetTop: IS_LIQUID_GLASS, children: _jsx(HomeScreenReady, __assign({}, props, { preferences: preferences, pinnedFeedInfos: pinnedFeedInfos })) }));
    }
    else {
        return (_jsx(Layout.Screen, { children: _jsx(Layout.Center, { style: styles.loading, children: _jsx(ActivityIndicator, { size: "large" }) }) }));
    }
}
function HomeScreenReady(_a) {
    var _b, _c;
    var preferences = _a.preferences, pinnedFeedInfos = _a.pinnedFeedInfos;
    var ax = useAnalytics();
    var allFeeds = React.useMemo(function () { return pinnedFeedInfos.map(function (f) { return f.feedDescriptor; }); }, [pinnedFeedInfos]);
    var maybeRawSelectedFeed = (_b = useSelectedFeed()) !== null && _b !== void 0 ? _b : allFeeds[0];
    var setSelectedFeed = useSetSelectedFeed();
    var maybeFoundIndex = allFeeds.indexOf(maybeRawSelectedFeed);
    var selectedIndex = Math.max(0, maybeFoundIndex);
    var maybeSelectedFeed = allFeeds[selectedIndex];
    var requestNotificationsPermission = useRequestNotificationsPermission();
    useSetTitle((_c = pinnedFeedInfos[selectedIndex]) === null || _c === void 0 ? void 0 : _c.displayName);
    useOTAUpdates();
    React.useEffect(function () {
        requestNotificationsPermission('Home');
    }, [requestNotificationsPermission]);
    var pagerRef = React.useRef(null);
    var lastPagerReportedIndexRef = React.useRef(selectedIndex);
    React.useLayoutEffect(function () {
        var _a;
        // Since the pager is not a controlled component, adjust it imperatively
        // if the selected index gets out of sync with what it last reported.
        // This is supposed to only happen on the web when you use the right nav.
        if (selectedIndex !== lastPagerReportedIndexRef.current) {
            lastPagerReportedIndexRef.current = selectedIndex;
            (_a = pagerRef.current) === null || _a === void 0 ? void 0 : _a.setPage(selectedIndex);
        }
    }, [selectedIndex]);
    var hasSession = useSession().hasSession;
    var setMinimalShellMode = useSetMinimalShellMode();
    useFocusEffect(React.useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    useFocusEffect(useNonReactiveCallback(function () {
        if (maybeSelectedFeed) {
            ax.metric('home:feedDisplayed', {
                index: selectedIndex,
                feedType: maybeSelectedFeed.split('|')[0],
                feedUrl: maybeSelectedFeed,
                reason: 'focus',
            });
        }
    }));
    var onPageSelected = React.useCallback(function (index) {
        setMinimalShellMode(false);
        var maybeFeed = allFeeds[index];
        // Mutate the ref before setting state to avoid the imperative syncing effect
        // above from starting a loop on Android when swiping back and forth.
        lastPagerReportedIndexRef.current = index;
        setSelectedFeed(maybeFeed);
        if (maybeFeed) {
            ax.metric('home:feedDisplayed', {
                index: index,
                feedType: maybeFeed.split('|')[0],
                feedUrl: maybeFeed,
            });
        }
    }, [ax, setSelectedFeed, setMinimalShellMode, allFeeds]);
    var onPressSelected = React.useCallback(function () {
        emitSoftReset();
    }, []);
    var onPageScrollStateChanged = React.useCallback(function (state) {
        'worklet';
        if (state === 'dragging') {
            setMinimalShellMode(false);
        }
    }, [setMinimalShellMode]);
    var demoMode = useDemoMode()[0];
    var renderTabBar = React.useCallback(function (props) {
        if (demoMode) {
            return (_jsx(HomeHeader, __assign({}, props, { testID: "homeScreenFeedTabs", onPressSelected: onPressSelected, 
                // @ts-ignore
                feeds: [{ displayName: 'Following' }, { displayName: 'Discover' }] }), "FEEDS_TAB_BAR"));
        }
        return (_jsx(HomeHeader, __assign({}, props, { testID: "homeScreenFeedTabs", onPressSelected: onPressSelected, feeds: pinnedFeedInfos }), "FEEDS_TAB_BAR"));
    }, [onPressSelected, pinnedFeedInfos, demoMode]);
    var renderFollowingEmptyState = React.useCallback(function () {
        return _jsx(FollowingEmptyState, {});
    }, []);
    var renderCustomFeedEmptyState = React.useCallback(function () {
        return _jsx(CustomFeedEmptyState, {});
    }, []);
    var homeFeedParams = React.useMemo(function () {
        return {
            mergeFeedEnabled: Boolean(preferences.feedViewPrefs.lab_mergeFeedEnabled),
            mergeFeedSources: preferences.feedViewPrefs.lab_mergeFeedEnabled
                ? preferences.savedFeeds
                    .filter(function (f) { return f.type === 'feed' || f.type === 'list'; })
                    .map(function (f) { return f.value; })
                : [],
        };
    }, [preferences]);
    if (demoMode) {
        return (_jsxs(Pager, { ref: pagerRef, testID: "homeScreen", onPageSelected: onPageSelected, onPageScrollStateChanged: onPageScrollStateChanged, renderTabBar: renderTabBar, initialPage: selectedIndex, children: [_jsx(FeedPage, { testID: "demoFeedPage", isPageFocused: true, isPageAdjacent: false, feed: "demo", renderEmptyState: renderCustomFeedEmptyState, feedInfo: pinnedFeedInfos[0] }), _jsx(FeedPage, { testID: "customFeedPage", isPageFocused: true, isPageAdjacent: false, feed: "feedgen|".concat(PROD_DEFAULT_FEED('whats-hot')), renderEmptyState: renderCustomFeedEmptyState, feedInfo: pinnedFeedInfos[0] })] }));
    }
    return hasSession ? (_jsx(Pager, { ref: pagerRef, testID: "homeScreen", initialPage: selectedIndex, onPageSelected: onPageSelected, onPageScrollStateChanged: onPageScrollStateChanged, renderTabBar: renderTabBar, children: pinnedFeedInfos.length ? (pinnedFeedInfos.map(function (feedInfo, index) {
            var feed = feedInfo.feedDescriptor;
            if (feed === 'following') {
                return (_jsx(FeedPage, { testID: "followingFeedPage", isPageFocused: maybeSelectedFeed === feed, isPageAdjacent: Math.abs(selectedIndex - index) === 1, feed: feed, feedParams: homeFeedParams, renderEmptyState: renderFollowingEmptyState, renderEndOfFeed: FollowingEndOfFeed, feedInfo: feedInfo }, feed));
            }
            var savedFeedConfig = feedInfo.savedFeed;
            return (_jsx(FeedPage, { testID: "customFeedPage", isPageFocused: maybeSelectedFeed === feed, isPageAdjacent: Math.abs(selectedIndex - index) === 1, feed: feed, renderEmptyState: renderCustomFeedEmptyState, savedFeedConfig: savedFeedConfig, feedInfo: feedInfo }, feed));
        })) : (_jsx(NoFeedsPinned, { preferences: preferences })) }, allFeeds.join(','))) : (_jsx(Pager, { testID: "homeScreen", onPageSelected: onPageSelected, onPageScrollStateChanged: onPageScrollStateChanged, renderTabBar: renderTabBar, children: _jsx(FeedPage, { testID: "customFeedPage", isPageFocused: true, isPageAdjacent: false, feed: "feedgen|".concat(PROD_DEFAULT_FEED('whats-hot')), renderEmptyState: renderCustomFeedEmptyState, feedInfo: pinnedFeedInfos[0] }) }));
}
var styles = StyleSheet.create({
    loading: {
        height: '100%',
        alignContent: 'center',
        justifyContent: 'center',
        paddingBottom: 100,
    },
});
