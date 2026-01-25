var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import { AppBskyFeedDefs } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { VIDEO_FEED_URIS } from '#/lib/constants';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { usePalette } from '#/lib/hooks/usePalette';
import { useSetTitle } from '#/lib/hooks/useSetTitle';
import { ComposeIcon2 } from '#/lib/icons';
import { makeRecordUri } from '#/lib/strings/url-helpers';
import { s } from '#/lib/styles';
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
import { FAB } from '#/view/com/util/fab/FAB';
import { Button } from '#/view/com/util/forms/Button';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';
import { PostFeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { Text } from '#/view/com/util/text/Text';
import { ProfileFeedHeader, ProfileFeedHeaderSkeleton, } from '#/screens/Profile/components/ProfileFeedHeader';
import { HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon } from '#/components/icons/Hashtag';
import * as Layout from '#/components/Layout';
import { IS_NATIVE } from '#/env';
export function ProfileFeedScreen(props) {
    var _a = props.route.params, rkey = _a.rkey, handleOrDid = _a.name;
    var feedParams = props.route.params.feedCacheKey
        ? {
            feedCacheKey: props.route.params.feedCacheKey,
        }
        : undefined;
    var pal = usePalette('default');
    var _ = useLingui()._;
    var navigation = useNavigation();
    var uri = useMemo(function () { return makeRecordUri(handleOrDid, 'app.bsky.feed.generator', rkey); }, [rkey, handleOrDid]);
    var _b = useResolveUriQuery(uri), error = _b.error, resolvedUri = _b.data;
    var onPressBack = React.useCallback(function () {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
        else {
            navigation.navigate('Home');
        }
    }, [navigation]);
    if (error) {
        return (_jsx(Layout.Screen, { testID: "profileFeedScreenError", children: _jsx(Layout.Content, { children: _jsxs(View, { style: [pal.view, pal.border, styles.notFoundContainer], children: [_jsx(Text, { type: "title-lg", style: [pal.text, s.mb10], children: _jsx(Trans, { children: "Could not load feed" }) }), _jsx(Text, { type: "md", style: [pal.text, s.mb20], children: error.toString() }), _jsx(View, { style: { flexDirection: 'row' }, children: _jsx(Button, { type: "default", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Go back"], ["Go back"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Returns to previous page"], ["Returns to previous page"])))), onPress: onPressBack, style: { flexShrink: 1 }, children: _jsx(Text, { type: "button", style: pal.text, children: _jsx(Trans, { children: "Go Back" }) }) }) })] }) }) }));
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
    var _b = React.useState(false), hasNew = _b[0], setHasNew = _b[1];
    var _c = React.useState(false), isScrolledDown = _c[0], setIsScrolledDown = _c[1];
    var queryClient = useQueryClient();
    var feedFeedback = useFeedFeedback(feedInfo, hasSession);
    var scrollElRef = useAnimatedRef();
    var onScrollToTop = useCallback(function () {
        var _a;
        (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
            animated: IS_NATIVE,
            offset: 0, // -headerHeight,
        });
        truncateAndInvalidate(queryClient, FEED_RQKEY(feed));
        setHasNew(false);
    }, [scrollElRef, queryClient, feed, setHasNew]);
    React.useEffect(function () {
        if (!isScreenFocused) {
            return;
        }
        return listenSoftReset(onScrollToTop);
    }, [onScrollToTop, isScreenFocused]);
    var renderPostsEmpty = useCallback(function () {
        return (_jsx(EmptyState, { icon: HashtagWideIcon, iconSize: "2xl", message: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["This feed is empty."], ["This feed is empty."])))) }));
    }, [_]);
    var isVideoFeed = React.useMemo(function () {
        var isBskyVideoFeed = VIDEO_FEED_URIS.includes(feedInfo.uri);
        var feedIsVideoMode = feedInfo.contentMode === AppBskyFeedDefs.CONTENTMODEVIDEO;
        var _isVideoFeed = isBskyVideoFeed || feedIsVideoMode;
        return IS_NATIVE && _isVideoFeed;
    }, [feedInfo]);
    return (_jsxs(_Fragment, { children: [_jsx(ProfileFeedHeader, { info: feedInfo }), _jsx(FeedFeedbackProvider, { value: feedFeedback, children: _jsx(PostFeed, { feed: feed, feedParams: feedParams, pollInterval: 60e3, disablePoll: hasNew, onHasNew: setHasNew, scrollElRef: scrollElRef, onScrolledDownChange: setIsScrolledDown, renderEmptyState: renderPostsEmpty, isVideoFeed: isVideoFeed }) }), (isScrolledDown || hasNew) && (_jsx(LoadLatestBtn, { onPress: onScrollToTop, label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Load new posts"], ["Load new posts"])))), showIndicator: hasNew })), hasSession && (_jsx(FAB, { testID: "composeFAB", onPress: function () { return openComposer({}); }, icon: _jsx(ComposeIcon2, { strokeWidth: 1.5, size: 29, style: { color: 'white' } }), accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["New post"], ["New post"])))), accessibilityHint: "" }))] }));
}
var styles = StyleSheet.create({
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 50,
        marginLeft: 6,
    },
    notFoundContainer: {
        margin: 10,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 6,
    },
    aboutSectionContainer: {
        paddingVertical: 4,
        paddingHorizontal: 16,
        gap: 12,
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
