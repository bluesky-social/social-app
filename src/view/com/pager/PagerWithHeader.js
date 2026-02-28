import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, } from 'react-native';
import Animated, { runOnUI, scrollTo, useAnimatedRef, useAnimatedStyle, useSharedValue, } from 'react-native-reanimated';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { ScrollProvider } from '#/lib/ScrollContext';
import { Pager, } from '#/view/com/pager/Pager';
import { useTheme } from '#/alf';
import { IS_IOS } from '#/env';
import { PagerHeaderProvider } from './PagerHeaderContext';
import { TabBar } from './TabBar';
export function PagerWithHeader(_a) {
    var ref = _a.ref, children = _a.children, testID = _a.testID, items = _a.items, isHeaderReady = _a.isHeaderReady, renderHeader = _a.renderHeader, initialPage = _a.initialPage, onPageSelected = _a.onPageSelected, onCurrentPageSelected = _a.onCurrentPageSelected, allowHeaderOverScroll = _a.allowHeaderOverScroll;
    var _b = useState(0), currentPage = _b[0], setCurrentPage = _b[1];
    var _c = useState(0), tabBarHeight = _c[0], setTabBarHeight = _c[1];
    var _d = useState(0), headerOnlyHeight = _d[0], setHeaderOnlyHeight = _d[1];
    var scrollY = useSharedValue(0);
    var headerHeight = headerOnlyHeight + tabBarHeight;
    // capture the header bar sizing
    var onTabBarLayout = useNonReactiveCallback(function (evt) {
        var height = evt.nativeEvent.layout.height;
        if (height > 0) {
            // The rounding is necessary to prevent jumps on iOS
            setTabBarHeight(Math.round(height * 2) / 2);
        }
    });
    var onHeaderOnlyLayout = useNonReactiveCallback(function (height) {
        if (height > 0) {
            // The rounding is necessary to prevent jumps on iOS
            setHeaderOnlyHeight(Math.round(height * 2) / 2);
        }
    });
    var renderTabBar = useCallback(function (props) {
        return (_jsx(PagerHeaderProvider, { scrollY: scrollY, headerHeight: headerOnlyHeight, children: _jsx(PagerTabBar, { headerOnlyHeight: headerOnlyHeight, items: items, isHeaderReady: isHeaderReady, renderHeader: renderHeader, currentPage: currentPage, onCurrentPageSelected: onCurrentPageSelected, onTabBarLayout: onTabBarLayout, onHeaderOnlyLayout: onHeaderOnlyLayout, onSelect: props.onSelect, scrollY: scrollY, testID: testID, allowHeaderOverScroll: allowHeaderOverScroll, dragProgress: props.dragProgress, dragState: props.dragState }) }));
    }, [
        headerOnlyHeight,
        items,
        isHeaderReady,
        renderHeader,
        currentPage,
        onCurrentPageSelected,
        onTabBarLayout,
        onHeaderOnlyLayout,
        scrollY,
        testID,
        allowHeaderOverScroll,
    ]);
    var scrollRefs = useSharedValue([]);
    var registerRef = useCallback(function (scrollRef, atIndex) {
        scrollRefs.modify(function (refs) {
            'worklet';
            refs[atIndex] = scrollRef;
            return refs;
        });
    }, [scrollRefs]);
    var lastForcedScrollY = useSharedValue(0);
    var adjustScrollForOtherPages = useCallback(function (scrollState) {
        'worklet';
        if (scrollState !== 'dragging')
            return;
        var currentScrollY = scrollY.get();
        var forcedScrollY = Math.min(currentScrollY, headerOnlyHeight);
        if (lastForcedScrollY.get() !== forcedScrollY) {
            lastForcedScrollY.set(forcedScrollY);
            var refs = scrollRefs.get();
            for (var i = 0; i < refs.length; i++) {
                var scollRef = refs[i];
                if (i !== currentPage && scollRef != null) {
                    scrollTo(scollRef, 0, forcedScrollY, false);
                }
            }
        }
    }, [currentPage, headerOnlyHeight, lastForcedScrollY, scrollRefs, scrollY]);
    var onScrollWorklet = useCallback(function (e) {
        'worklet';
        var nextScrollY = e.contentOffset.y;
        // HACK: onScroll is reporting some strange values on load (negative header height).
        // Highly improbable that you'd be overscrolled by over 400px -
        // in fact, I actually can't do it, so let's just ignore those. -sfn
        var isPossiblyInvalid = headerHeight > 0 && Math.round(nextScrollY * 2) / 2 === -headerHeight;
        if (!isPossiblyInvalid) {
            scrollY.set(nextScrollY);
        }
    }, [scrollY, headerHeight]);
    var onPageSelectedInner = useCallback(function (index) {
        setCurrentPage(index);
        onPageSelected === null || onPageSelected === void 0 ? void 0 : onPageSelected(index);
    }, [onPageSelected, setCurrentPage]);
    var onTabPressed = useCallback(function () {
        runOnUI(adjustScrollForOtherPages)('dragging');
    }, [adjustScrollForOtherPages]);
    return (_jsx(Pager, { ref: ref, testID: testID, initialPage: initialPage, onTabPressed: onTabPressed, onPageSelected: onPageSelectedInner, renderTabBar: renderTabBar, onPageScrollStateChanged: adjustScrollForOtherPages, children: toArray(children)
            .filter(Boolean)
            .map(function (child, i) {
            var isReady = isHeaderReady && headerOnlyHeight > 0 && tabBarHeight > 0;
            return (_jsx(View, { collapsable: false, children: _jsx(PagerItem, { headerHeight: headerHeight, index: i, isReady: isReady, isFocused: i === currentPage, onScrollWorklet: i === currentPage ? onScrollWorklet : noop, registerRef: registerRef, renderTab: child }) }, i));
        }) }));
}
var PagerTabBar = function (_a) {
    var currentPage = _a.currentPage, headerOnlyHeight = _a.headerOnlyHeight, isHeaderReady = _a.isHeaderReady, items = _a.items, scrollY = _a.scrollY, testID = _a.testID, renderHeader = _a.renderHeader, onHeaderOnlyLayout = _a.onHeaderOnlyLayout, onTabBarLayout = _a.onTabBarLayout, onCurrentPageSelected = _a.onCurrentPageSelected, onSelect = _a.onSelect, allowHeaderOverScroll = _a.allowHeaderOverScroll, dragProgress = _a.dragProgress, dragState = _a.dragState;
    var t = useTheme();
    var _b = useState(0), minimumHeaderHeight = _b[0], setMinimumHeaderHeight = _b[1];
    var headerTransform = useAnimatedStyle(function () {
        var translateY = Math.min(scrollY.get(), Math.max(headerOnlyHeight - minimumHeaderHeight, 0)) * -1;
        return {
            transform: [
                {
                    translateY: allowHeaderOverScroll
                        ? translateY
                        : Math.min(translateY, 0),
                },
            ],
        };
    });
    var headerRef = useRef(null);
    return (_jsxs(Animated.View, { pointerEvents: IS_IOS ? 'auto' : 'box-none', style: [styles.tabBarMobile, headerTransform, t.atoms.bg], children: [_jsxs(View, { ref: headerRef, pointerEvents: IS_IOS ? 'auto' : 'box-none', collapsable: false, children: [renderHeader === null || renderHeader === void 0 ? void 0 : renderHeader({ setMinimumHeight: setMinimumHeaderHeight }), 
                    // It wouldn't be enough to place `onLayout` on the parent node because
                    // this would risk measuring before `isHeaderReady` has turned `true`.
                    // Instead, we'll render a brand node conditionally and get fresh layout.
                    isHeaderReady && (_jsx(View
                    // It wouldn't be enough to do this in a `ref` of an effect because,
                    // even if `isHeaderReady` might have turned `true`, the associated
                    // layout might not have been performed yet on the native side.
                    , { 
                        // It wouldn't be enough to do this in a `ref` of an effect because,
                        // even if `isHeaderReady` might have turned `true`, the associated
                        // layout might not have been performed yet on the native side.
                        onLayout: function () {
                            var _a;
                            // @ts-ignore
                            (_a = headerRef.current) === null || _a === void 0 ? void 0 : _a.measure(function (_x, _y, _width, height) {
                                onHeaderOnlyLayout(height);
                            });
                        } }))] }), _jsx(View, { onLayout: onTabBarLayout, style: {
                    // Render it immediately to measure it early since its size doesn't depend on the content.
                    // However, keep it invisible until the header above stabilizes in order to prevent jumps.
                    opacity: isHeaderReady ? 1 : 0,
                    pointerEvents: isHeaderReady ? 'auto' : 'none',
                }, children: _jsx(TabBar, { testID: testID, items: items, selectedPage: currentPage, onSelect: onSelect, onPressSelected: onCurrentPageSelected, dragProgress: dragProgress, dragState: dragState }) })] }));
};
PagerTabBar = memo(PagerTabBar);
function PagerItem(_a) {
    var headerHeight = _a.headerHeight, index = _a.index, isReady = _a.isReady, isFocused = _a.isFocused, onScrollWorklet = _a.onScrollWorklet, renderTab = _a.renderTab, registerRef = _a.registerRef;
    var scrollElRef = useAnimatedRef();
    useEffect(function () {
        registerRef(scrollElRef, index);
        return function () {
            registerRef(null, index);
        };
    }, [scrollElRef, registerRef, index]);
    if (!isReady || renderTab == null) {
        return null;
    }
    return (_jsx(ScrollProvider, { onScroll: onScrollWorklet, children: renderTab({
            headerHeight: headerHeight,
            isFocused: isFocused,
            scrollElRef: scrollElRef,
        }) }));
}
var styles = StyleSheet.create({
    tabBarMobile: {
        position: 'absolute',
        zIndex: 1,
        top: 0,
        left: 0,
        width: '100%',
    },
});
function noop() {
    'worklet';
}
function toArray(v) {
    if (Array.isArray(v)) {
        return v;
    }
    return [v];
}
