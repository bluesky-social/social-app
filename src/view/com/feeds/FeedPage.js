var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { View } from 'react-native';
import { AppBskyFeedDefs } from '@atproto/api';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { DISCOVER_FEED_URI, VIDEO_FEED_URIS } from '#/lib/constants';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { ComposeIcon2 } from '#/lib/icons';
import { getRootNavigation, getTabState, TabState } from '#/lib/routes/helpers';
import { s } from '#/lib/styles';
import { listenSoftReset } from '#/state/events';
import { FeedFeedbackProvider, useFeedFeedback } from '#/state/feed-feedback';
import { useSetHomeBadge } from '#/state/home-badge';
import { RQKEY as FEED_RQKEY, } from '#/state/queries/post-feed';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useSession } from '#/state/session';
import { useSetMinimalShellMode } from '#/state/shell';
import { useHeaderOffset } from '#/components/hooks/useHeaderOffset';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
import { PostFeed } from '../posts/PostFeed';
import { FAB } from '../util/fab/FAB';
import { LoadLatestBtn } from '../util/load-latest/LoadLatestBtn';
import { MainScrollProvider } from '../util/MainScrollProvider';
var POLL_FREQ = 60e3; // 60sec
export function FeedPage(_a) {
    var testID = _a.testID, isPageFocused = _a.isPageFocused, isPageAdjacent = _a.isPageAdjacent, feed = _a.feed, feedParams = _a.feedParams, renderEmptyState = _a.renderEmptyState, renderEndOfFeed = _a.renderEndOfFeed, savedFeedConfig = _a.savedFeedConfig, feedInfo = _a.feedInfo;
    var ax = useAnalytics();
    var hasSession = useSession().hasSession;
    var _ = useLingui()._;
    var navigation = useNavigation();
    var queryClient = useQueryClient();
    var openComposer = useOpenComposer().openComposer;
    var _b = useState(false), isScrolledDown = _b[0], setIsScrolledDown = _b[1];
    var setMinimalShellMode = useSetMinimalShellMode();
    var headerOffset = useHeaderOffset();
    var feedFeedback = useFeedFeedback(feedInfo, hasSession);
    var scrollElRef = useRef(null);
    var _c = useState(false), hasNew = _c[0], setHasNew = _c[1];
    var setHomeBadge = useSetHomeBadge();
    var isVideoFeed = useMemo(function () {
        var isBskyVideoFeed = VIDEO_FEED_URIS.includes(feedInfo.uri);
        var feedIsVideoMode = feedInfo.contentMode === AppBskyFeedDefs.CONTENTMODEVIDEO;
        var _isVideoFeed = isBskyVideoFeed || feedIsVideoMode;
        return IS_NATIVE && _isVideoFeed;
    }, [feedInfo]);
    useEffect(function () {
        if (isPageFocused) {
            setHomeBadge(hasNew);
        }
    }, [isPageFocused, hasNew, setHomeBadge]);
    var scrollToTop = useCallback(function () {
        var _a;
        (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
            animated: IS_NATIVE,
            offset: -headerOffset,
        });
        setMinimalShellMode(false);
    }, [headerOffset, setMinimalShellMode]);
    var onSoftReset = useCallback(function () {
        var isScreenFocused = getTabState(getRootNavigation(navigation).getState(), 'Home') ===
            TabState.InsideAtRoot;
        if (isScreenFocused && isPageFocused) {
            scrollToTop();
            truncateAndInvalidate(queryClient, FEED_RQKEY(feed));
            setHasNew(false);
            ax.metric('feed:refresh', {
                feedType: feed.split('|')[0],
                feedUrl: feed,
                reason: 'soft-reset',
            });
        }
    }, [ax, navigation, isPageFocused, scrollToTop, queryClient, feed]);
    // fires when page within screen is activated/deactivated
    useEffect(function () {
        if (!isPageFocused) {
            return;
        }
        return listenSoftReset(onSoftReset);
    }, [onSoftReset, isPageFocused]);
    var onPressCompose = useCallback(function () {
        openComposer({});
    }, [openComposer]);
    var onPressLoadLatest = useCallback(function () {
        scrollToTop();
        truncateAndInvalidate(queryClient, FEED_RQKEY(feed));
        setHasNew(false);
        ax.metric('feed:refresh', {
            feedType: feed.split('|')[0],
            feedUrl: feed,
            reason: 'load-latest',
        });
    }, [ax, scrollToTop, feed, queryClient]);
    var shouldPrefetch = IS_NATIVE && isPageAdjacent;
    var isDiscoverFeed = feedInfo.uri === DISCOVER_FEED_URI;
    return (_jsxs(View, { testID: testID, 
        // @ts-expect-error web only -sfn
        dataSet: { nosnippet: isDiscoverFeed ? '' : undefined }, children: [_jsx(MainScrollProvider, { children: _jsx(FeedFeedbackProvider, { value: feedFeedback, children: _jsx(PostFeed, { testID: testID ? "".concat(testID, "-feed") : undefined, enabled: isPageFocused || shouldPrefetch, feed: feed, feedParams: feedParams, pollInterval: POLL_FREQ, disablePoll: hasNew || !isPageFocused, scrollElRef: scrollElRef, onScrolledDownChange: setIsScrolledDown, onHasNew: setHasNew, renderEmptyState: renderEmptyState, renderEndOfFeed: renderEndOfFeed, headerOffset: headerOffset, savedFeedConfig: savedFeedConfig, isVideoFeed: isVideoFeed }) }) }), (isScrolledDown || hasNew) && (_jsx(LoadLatestBtn, { onPress: onPressLoadLatest, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Load new posts"], ["Load new posts"])))), showIndicator: hasNew })), hasSession && (_jsx(FAB, { testID: "composeFAB", onPress: onPressCompose, icon: _jsx(ComposeIcon2, { strokeWidth: 1.5, size: 29, style: s.white }), accessibilityRole: "button", accessibilityLabel: _(msg({ message: "New post", context: 'action' })), accessibilityHint: "" }))] }));
}
var templateObject_1;
