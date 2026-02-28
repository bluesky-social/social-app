var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAnimatedRef } from 'react-native-reanimated';
import { AppBskyFeedDefs } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useIsFocused } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { VIDEO_FEED_URIS } from '#/lib/constants';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useSetTitle } from '#/lib/hooks/useSetTitle';
import { ComposeIcon2 } from '#/lib/icons';
import { cleanError } from '#/lib/strings/errors';
import { makeRecordUri } from '#/lib/strings/url-helpers';
import { listenSoftReset } from '#/state/events';
import { FeedFeedbackProvider, useFeedFeedback } from '#/state/feed-feedback';
import { useFeedSourceInfoQuery, } from '#/state/queries/feed';
import { RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';
import { usePreferencesQuery, } from '#/state/queries/preferences';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useSession } from '#/state/session';
import { PostFeed } from '#/view/com/posts/PostFeed';
import { EmptyState } from '#/view/com/util/EmptyState';
import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { FAB } from '#/view/com/util/fab/FAB';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';
import { PostFeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { ProfileFeedHeader, ProfileFeedHeaderSkeleton, } from '#/screens/Profile/components/ProfileFeedHeader';
import { HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon } from '#/components/icons/Hashtag';
import * as Layout from '#/components/Layout';
import { IS_NATIVE } from '#/env';
export function ProfileFeedScreen(props) {
    var _a = props.route.params, rkey = _a.rkey, handleOrDid = _a.name;
    var feedParams = props.route.params.feedCacheKey
        ? { feedCacheKey: props.route.params.feedCacheKey }
        : undefined;
    var _ = useLingui()._;
    var uri = useMemo(function () { return makeRecordUri(handleOrDid, 'app.bsky.feed.generator', rkey); }, [rkey, handleOrDid]);
    var _b = useResolveUriQuery(uri), error = _b.error, resolvedUri = _b.data, refetch = _b.refetch, isRefetching = _b.isRefetching;
    if (error && !isRefetching) {
        return (_jsx(Layout.Screen, { testID: "profileFeedScreenError", children: _jsx(ErrorScreen, { showHeader: true, title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Could not load feed"], ["Could not load feed"])))), message: cleanError(error), onPressTryAgain: function () { return void refetch(); } }) }));
    }
    return resolvedUri ? (_jsx(Layout.Screen, { testID: "profileFeedScreen", children: _jsx(ProfileFeedScreenIntermediate, { feedUri: resolvedUri.uri, feedParams: feedParams }) })) : (_jsxs(Layout.Screen, { testID: "profileFeedScreen", children: [_jsx(ProfileFeedHeaderSkeleton, {}), _jsx(Layout.Content, { children: _jsx(PostFeedLoadingPlaceholder, {}) })] }));
}
function ProfileFeedScreenIntermediate(_a) {
    var feedUri = _a.feedUri, feedParams = _a.feedParams;
    var preferences = usePreferencesQuery().data;
    var info = useFeedSourceInfoQuery({ uri: feedUri }).data;
    if (!preferences || !info) {
        return (_jsxs(Layout.Content, { children: [_jsx(ProfileFeedHeaderSkeleton, {}), _jsx(PostFeedLoadingPlaceholder, {})] }));
    }
    return (_jsx(ProfileFeedScreenInner, { preferences: preferences, feedInfo: info, feedParams: feedParams }));
}
export function ProfileFeedScreenInner(_a) {
    var feedInfo = _a.feedInfo, feedParams = _a.feedParams;
    var _ = useLingui()._;
    var hasSession = useSession().hasSession;
    var openComposer = useOpenComposer().openComposer;
    var isScreenFocused = useIsFocused();
    useSetTitle(feedInfo === null || feedInfo === void 0 ? void 0 : feedInfo.displayName);
    var feed = "feedgen|".concat(feedInfo.uri);
    var _b = useState(false), hasNew = _b[0], setHasNew = _b[1];
    var _c = useState(false), isScrolledDown = _c[0], setIsScrolledDown = _c[1];
    var queryClient = useQueryClient();
    var feedFeedback = useFeedFeedback(feedInfo, hasSession);
    var scrollElRef = useAnimatedRef();
    var onScrollToTop = useCallback(function () {
        var _a;
        (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
            animated: IS_NATIVE,
            offset: 0, // -headerHeight,
        });
        void truncateAndInvalidate(queryClient, FEED_RQKEY(feed));
        setHasNew(false);
    }, [scrollElRef, queryClient, feed, setHasNew]);
    useEffect(function () {
        if (!isScreenFocused) {
            return;
        }
        return listenSoftReset(onScrollToTop);
    }, [onScrollToTop, isScreenFocused]);
    var renderPostsEmpty = useCallback(function () {
        return (_jsx(EmptyState, { icon: HashtagWideIcon, iconSize: "2xl", message: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["This feed is empty."], ["This feed is empty."])))) }));
    }, [_]);
    var isVideoFeed = useMemo(function () {
        var isBskyVideoFeed = VIDEO_FEED_URIS.includes(feedInfo.uri);
        var feedIsVideoMode = feedInfo.contentMode === AppBskyFeedDefs.CONTENTMODEVIDEO;
        var _isVideoFeed = isBskyVideoFeed || feedIsVideoMode;
        return IS_NATIVE && _isVideoFeed;
    }, [feedInfo]);
    return (_jsxs(_Fragment, { children: [_jsx(ProfileFeedHeader, { info: feedInfo }), _jsx(FeedFeedbackProvider, { value: feedFeedback, children: _jsx(PostFeed, { feed: feed, feedParams: feedParams, pollInterval: 60e3, disablePoll: hasNew, onHasNew: setHasNew, scrollElRef: scrollElRef, onScrolledDownChange: setIsScrolledDown, renderEmptyState: renderPostsEmpty, isVideoFeed: isVideoFeed }) }), (isScrolledDown || hasNew) && (_jsx(LoadLatestBtn, { onPress: onScrollToTop, label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Load new posts"], ["Load new posts"])))), showIndicator: hasNew })), hasSession && (_jsx(FAB, { testID: "composeFAB", onPress: function () { return openComposer({ logContext: 'Fab' }); }, icon: _jsx(ComposeIcon2, { strokeWidth: 1.5, size: 29, style: { color: 'white' } }), accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["New post"], ["New post"])))), accessibilityHint: "" }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
