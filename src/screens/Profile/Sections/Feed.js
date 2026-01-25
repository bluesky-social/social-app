var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { findNodeHandle, View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { RQKEY as FEED_RQKEY, } from '#/state/queries/post-feed';
import { truncateAndInvalidate } from '#/state/queries/util';
import { PostFeed } from '#/view/com/posts/PostFeed';
import { EmptyState, } from '#/view/com/util/EmptyState';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';
import { atoms as a, ios, useTheme } from '#/alf';
import { EditBig_Stroke1_Corner0_Rounded as EditIcon } from '#/components/icons/EditBig';
import { Text } from '#/components/Typography';
import { IS_IOS, IS_NATIVE } from '#/env';
export function ProfileFeedSection(_a) {
    var ref = _a.ref, feed = _a.feed, headerHeight = _a.headerHeight, isFocused = _a.isFocused, scrollElRef = _a.scrollElRef, ignoreFilterFor = _a.ignoreFilterFor, setScrollViewTag = _a.setScrollViewTag, emptyStateMessage = _a.emptyStateMessage, emptyStateButton = _a.emptyStateButton, emptyStateIcon = _a.emptyStateIcon;
    var _ = useLingui()._;
    var queryClient = useQueryClient();
    var _b = useState(false), hasNew = _b[0], setHasNew = _b[1];
    var _c = useState(false), isScrolledDown = _c[0], setIsScrolledDown = _c[1];
    var shouldUseAdjustedNumToRender = feed.endsWith('posts_and_author_threads');
    var isVideoFeed = IS_NATIVE && feed.endsWith('posts_with_video');
    var adjustedInitialNumToRender = useInitialNumToRender({
        screenHeightOffset: headerHeight,
    });
    var onScrollToTop = useCallback(function () {
        var _a;
        (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
            animated: IS_NATIVE,
            offset: -headerHeight,
        });
        truncateAndInvalidate(queryClient, FEED_RQKEY(feed));
        setHasNew(false);
    }, [scrollElRef, headerHeight, queryClient, feed, setHasNew]);
    useImperativeHandle(ref, function () { return ({
        scrollToTop: onScrollToTop,
    }); });
    var renderPostsEmpty = useCallback(function () {
        return (_jsx(View, { style: [a.flex_1, a.justify_center, a.align_center], children: _jsx(EmptyState, { style: { width: '100%' }, icon: emptyStateIcon || EditIcon, iconSize: "3xl", message: emptyStateMessage || _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["No posts yet"], ["No posts yet"])))), button: emptyStateButton }) }));
    }, [_, emptyStateButton, emptyStateIcon, emptyStateMessage]);
    useEffect(function () {
        if (IS_IOS && isFocused && scrollElRef.current) {
            var nativeTag = findNodeHandle(scrollElRef.current);
            setScrollViewTag(nativeTag);
        }
    }, [isFocused, scrollElRef, setScrollViewTag]);
    return (_jsxs(View, { children: [_jsx(PostFeed, { testID: "postsFeed", enabled: isFocused, feed: feed, scrollElRef: scrollElRef, onHasNew: setHasNew, onScrolledDownChange: setIsScrolledDown, renderEmptyState: renderPostsEmpty, headerOffset: headerHeight, progressViewOffset: ios(0), renderEndOfFeed: isVideoFeed ? undefined : ProfileEndOfFeed, ignoreFilterFor: ignoreFilterFor, initialNumToRender: shouldUseAdjustedNumToRender ? adjustedInitialNumToRender : undefined, isVideoFeed: isVideoFeed }), (isScrolledDown || hasNew) && (_jsx(LoadLatestBtn, { onPress: onScrollToTop, label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Load new posts"], ["Load new posts"])))), showIndicator: hasNew }))] }));
}
function ProfileEndOfFeed() {
    var t = useTheme();
    return (_jsx(View, { style: [a.w_full, a.py_5xl, a.border_t, t.atoms.border_contrast_medium], children: _jsx(Text, { style: [t.atoms.text_contrast_medium, a.text_center], children: _jsx(Trans, { children: "End of feed" }) }) }));
}
var templateObject_1, templateObject_2;
