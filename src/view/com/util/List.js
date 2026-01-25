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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
import React, { memo } from 'react';
import { RefreshControl } from 'react-native';
import { runOnJS, useAnimatedScrollHandler, useSharedValue, } from 'react-native-reanimated';
import { updateActiveVideoViewAsync } from '@haileyok/bluesky-video';
import { useDedupe } from '#/lib/hooks/useDedupe';
import { useScrollHandlers } from '#/lib/ScrollContext';
import { addStyle } from '#/lib/styles';
import { useLightbox } from '#/state/lightbox';
import { useTheme } from '#/alf';
import { IS_IOS } from '#/env';
import { FlatList_INTERNAL } from './Views';
var SCROLLED_DOWN_LIMIT = 200;
var List = React.forwardRef(function (_a, ref) {
    var onScrolledDownChange = _a.onScrolledDownChange, refreshing = _a.refreshing, onRefresh = _a.onRefresh, onItemSeen = _a.onItemSeen, headerOffset = _a.headerOffset, style = _a.style, progressViewOffset = _a.progressViewOffset, _b = _a.automaticallyAdjustsScrollIndicatorInsets, automaticallyAdjustsScrollIndicatorInsets = _b === void 0 ? false : _b, props = __rest(_a, ["onScrolledDownChange", "refreshing", "onRefresh", "onItemSeen", "headerOffset", "style", "progressViewOffset", "automaticallyAdjustsScrollIndicatorInsets"]);
    var isScrolledDown = useSharedValue(false);
    var t = useTheme();
    var dedupe = useDedupe(400);
    var scrollsToTop = useAllowScrollToTop();
    function handleScrolledDownChange(didScrollDown) {
        onScrolledDownChange === null || onScrolledDownChange === void 0 ? void 0 : onScrolledDownChange(didScrollDown);
    }
    // Intentionally destructured outside the main thread closure.
    // See https://github.com/bluesky-social/social-app/pull/4108.
    var _c = useScrollHandlers(), onBeginDragFromContext = _c.onBeginDrag, onEndDragFromContext = _c.onEndDrag, onScrollFromContext = _c.onScroll, onMomentumEndFromContext = _c.onMomentumEnd;
    var scrollHandler = useAnimatedScrollHandler({
        onBeginDrag: function (e, ctx) {
            onBeginDragFromContext === null || onBeginDragFromContext === void 0 ? void 0 : onBeginDragFromContext(e, ctx);
        },
        onEndDrag: function (e, ctx) {
            runOnJS(updateActiveVideoViewAsync)();
            onEndDragFromContext === null || onEndDragFromContext === void 0 ? void 0 : onEndDragFromContext(e, ctx);
        },
        onScroll: function (e, ctx) {
            onScrollFromContext === null || onScrollFromContext === void 0 ? void 0 : onScrollFromContext(e, ctx);
            var didScrollDown = e.contentOffset.y > SCROLLED_DOWN_LIMIT;
            if (isScrolledDown.get() !== didScrollDown) {
                isScrolledDown.set(didScrollDown);
                if (onScrolledDownChange != null) {
                    runOnJS(handleScrolledDownChange)(didScrollDown);
                }
            }
            if (IS_IOS) {
                runOnJS(dedupe)(updateActiveVideoViewAsync);
            }
        },
        // Note: adding onMomentumBegin here makes simulator scroll
        // lag on Android. So either don't add it, or figure out why.
        onMomentumEnd: function (e, ctx) {
            runOnJS(updateActiveVideoViewAsync)();
            onMomentumEndFromContext === null || onMomentumEndFromContext === void 0 ? void 0 : onMomentumEndFromContext(e, ctx);
        },
    });
    var _d = React.useMemo(function () {
        if (!onItemSeen) {
            return [undefined, undefined];
        }
        return [
            function (info) {
                for (var _i = 0, _a = info.changed; _i < _a.length; _i++) {
                    var item = _a[_i];
                    if (item.isViewable) {
                        onItemSeen(item.item);
                    }
                }
            },
            {
                itemVisiblePercentThreshold: 40,
                minimumViewTime: 0.5e3,
            },
        ];
    }, [onItemSeen]), onViewableItemsChanged = _d[0], viewabilityConfig = _d[1];
    var refreshControl;
    if (refreshing !== undefined || onRefresh !== undefined) {
        refreshControl = (_jsx(RefreshControl, { refreshing: refreshing !== null && refreshing !== void 0 ? refreshing : false, onRefresh: onRefresh, tintColor: t.atoms.text.color, titleColor: t.atoms.text.color, progressViewOffset: progressViewOffset !== null && progressViewOffset !== void 0 ? progressViewOffset : headerOffset }, t.atoms.text.color));
    }
    var contentOffset;
    if (headerOffset != null) {
        style = addStyle(style, {
            paddingTop: headerOffset,
        });
        contentOffset = { x: 0, y: headerOffset * -1 };
    }
    return (_jsx(FlatList_INTERNAL, __assign({ showsVerticalScrollIndicator // overridable
        : true, onViewableItemsChanged: onViewableItemsChanged, viewabilityConfig: viewabilityConfig }, props, { automaticallyAdjustsScrollIndicatorInsets: automaticallyAdjustsScrollIndicatorInsets, scrollIndicatorInsets: __assign({ top: headerOffset, right: 1 }, props.scrollIndicatorInsets), indicatorStyle: t.scheme === 'dark' ? 'white' : 'black', contentOffset: contentOffset, refreshControl: refreshControl, onScroll: scrollHandler, scrollsToTop: scrollsToTop, scrollEventThrottle: 1, style: style, 
        // @ts-expect-error FlatList_INTERNAL ref type is wrong -sfn
        ref: ref })));
});
List.displayName = 'List';
List = memo(List);
export { List };
// We only want to use this context value on iOS because the `scrollsToTop` prop is iOS-only
// removing it saves us a re-render on Android
var useAllowScrollToTop = IS_IOS ? useAllowScrollToTopIOS : function () { return undefined; };
function useAllowScrollToTopIOS() {
    var activeLightbox = useLightbox().activeLightbox;
    return !activeLightbox;
}
