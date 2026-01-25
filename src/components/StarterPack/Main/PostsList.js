var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { PostFeed } from '#/view/com/posts/PostFeed';
import { EmptyState } from '#/view/com/util/EmptyState';
import { HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon } from '#/components/icons/Hashtag';
import { IS_NATIVE } from '#/env';
export var PostsList = React.forwardRef(function PostsListImpl(_a, ref) {
    var listUri = _a.listUri, headerHeight = _a.headerHeight, scrollElRef = _a.scrollElRef;
    var feed = "list|".concat(listUri);
    var _ = useLingui()._;
    var onScrollToTop = useCallback(function () {
        var _a;
        (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
            animated: IS_NATIVE,
            offset: -headerHeight,
        });
    }, [scrollElRef, headerHeight]);
    React.useImperativeHandle(ref, function () { return ({
        scrollToTop: onScrollToTop,
    }); });
    var renderPostsEmpty = useCallback(function () {
        return (_jsx(EmptyState, { icon: HashtagWideIcon, iconSize: "2xl", message: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["This feed is empty."], ["This feed is empty."])))) }));
    }, [_]);
    return (_jsx(View, { children: _jsx(PostFeed, { feed: feed, pollInterval: 60e3, scrollElRef: scrollElRef, renderEmptyState: renderPostsEmpty, headerOffset: headerHeight }) }));
});
var templateObject_1;
