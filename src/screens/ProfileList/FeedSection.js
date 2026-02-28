var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useIsFocused } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { listenSoftReset } from '#/state/events';
import { RQKEY as FEED_RQKEY, } from '#/state/queries/post-feed';
import { PostFeed } from '#/view/com/posts/PostFeed';
import { EmptyState } from '#/view/com/util/EmptyState';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';
import { atoms as a } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon } from '#/components/icons/Hashtag';
import { PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon } from '#/components/icons/Person';
import { IS_NATIVE } from '#/env';
export function FeedSection(_a) {
    var ref = _a.ref, feed = _a.feed, scrollElRef = _a.scrollElRef, headerHeight = _a.headerHeight, isFocused = _a.isFocused, isOwner = _a.isOwner, onPressAddUser = _a.onPressAddUser;
    var queryClient = useQueryClient();
    var _b = useState(false), hasNew = _b[0], setHasNew = _b[1];
    var _c = useState(false), isScrolledDown = _c[0], setIsScrolledDown = _c[1];
    var isScreenFocused = useIsFocused();
    var _ = useLingui()._;
    var onScrollToTop = useCallback(function () {
        var _a;
        (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
            animated: IS_NATIVE,
            offset: -headerHeight,
        });
        queryClient.resetQueries({ queryKey: FEED_RQKEY(feed) });
        setHasNew(false);
    }, [scrollElRef, headerHeight, queryClient, feed, setHasNew]);
    useImperativeHandle(ref, function () { return ({
        scrollToTop: onScrollToTop,
    }); });
    useEffect(function () {
        if (!isScreenFocused) {
            return;
        }
        return listenSoftReset(onScrollToTop);
    }, [onScrollToTop, isScreenFocused]);
    var renderPostsEmpty = useCallback(function () {
        return (_jsxs(View, { style: [a.gap_xl, a.align_center], children: [_jsx(EmptyState, { icon: HashtagWideIcon, iconSize: "2xl", message: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["This feed is empty."], ["This feed is empty."])))) }), isOwner && (_jsxs(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Start adding people"], ["Start adding people"])))), onPress: onPressAddUser, color: "primary", size: "small", children: [_jsx(ButtonIcon, { icon: PersonPlusIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Start adding people!" }) })] }))] }));
    }, [_, onPressAddUser, isOwner]);
    return (_jsxs(View, { children: [_jsx(PostFeed, { testID: "listFeed", enabled: isFocused, feed: feed, pollInterval: 60e3, disablePoll: hasNew, scrollElRef: scrollElRef, onHasNew: setHasNew, onScrolledDownChange: setIsScrolledDown, renderEmptyState: renderPostsEmpty, headerOffset: headerHeight }), (isScrolledDown || hasNew) && (_jsx(LoadLatestBtn, { onPress: onScrollToTop, label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Load new posts"], ["Load new posts"])))), showIndicator: hasNew }))] }));
}
var templateObject_1, templateObject_2, templateObject_3;
