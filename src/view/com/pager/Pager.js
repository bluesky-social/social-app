import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useCallback, useContext, useImperativeHandle, useMemo, useRef, useState, } from 'react';
import { View } from 'react-native';
import { DrawerGestureContext } from 'react-native-drawer-layout';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import PagerView from 'react-native-pager-view';
import Animated, { runOnJS, useEvent, useHandler, useSharedValue, } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useSetDrawerSwipeDisabled } from '#/state/shell';
import { atoms as a, native } from '#/alf';
var AnimatedPagerView = Animated.createAnimatedComponent(PagerView);
var MemoizedAnimatedPagerView = memo(AnimatedPagerView);
export function Pager(_a) {
    var ref = _a.ref, children = _a.children, _b = _a.initialPage, initialPage = _b === void 0 ? 0 : _b, renderTabBar = _a.renderTabBar, parentOnPageSelected = _a.onPageSelected, parentOnTabPressed = _a.onTabPressed, parentOnPageScrollStateChanged = _a.onPageScrollStateChanged, testID = _a.testID;
    var _c = useState(initialPage), selectedPage = _c[0], setSelectedPage = _c[1];
    var pagerView = useRef(null);
    var _d = useState(true), isIdle = _d[0], setIsIdle = _d[1];
    var setDrawerSwipeDisabled = useSetDrawerSwipeDisabled();
    useFocusEffect(useCallback(function () {
        var canSwipeDrawer = selectedPage === 0 && isIdle;
        setDrawerSwipeDisabled(!canSwipeDrawer);
        return function () {
            setDrawerSwipeDisabled(false);
        };
    }, [setDrawerSwipeDisabled, selectedPage, isIdle]));
    useImperativeHandle(ref, function () { return ({
        setPage: function (index) {
            var _a;
            (_a = pagerView.current) === null || _a === void 0 ? void 0 : _a.setPage(index);
        },
    }); });
    var onPageSelectedJSThread = useCallback(function (nextPosition) {
        setSelectedPage(nextPosition);
        parentOnPageSelected === null || parentOnPageSelected === void 0 ? void 0 : parentOnPageSelected(nextPosition);
    }, [setSelectedPage, parentOnPageSelected]);
    var onTabBarSelect = useCallback(function (index) {
        var _a;
        parentOnTabPressed === null || parentOnTabPressed === void 0 ? void 0 : parentOnTabPressed(index);
        (_a = pagerView.current) === null || _a === void 0 ? void 0 : _a.setPage(index);
    }, [pagerView, parentOnTabPressed]);
    var dragState = useSharedValue('idle');
    var dragProgress = useSharedValue(selectedPage);
    var didInit = useSharedValue(false);
    var handlePageScroll = usePagerHandlers({
        onPageScroll: function (e) {
            'worklet';
            if (didInit.get() === false) {
                // On iOS, there's a spurious scroll event with 0 position
                // even if a different page was supplied as the initial page.
                // Ignore it and wait for the first confirmed selection instead.
                return;
            }
            dragProgress.set(e.offset + e.position);
        },
        onPageScrollStateChanged: function (e) {
            'worklet';
            runOnJS(setIsIdle)(e.pageScrollState === 'idle');
            if (dragState.get() === 'idle' && e.pageScrollState === 'settling') {
                // This is a programmatic scroll on Android.
                // Stay "idle" to match iOS and avoid confusing downstream code.
                return;
            }
            dragState.set(e.pageScrollState);
            parentOnPageScrollStateChanged === null || parentOnPageScrollStateChanged === void 0 ? void 0 : parentOnPageScrollStateChanged(e.pageScrollState);
        },
        onPageSelected: function (e) {
            'worklet';
            didInit.set(true);
            runOnJS(onPageSelectedJSThread)(e.position);
        },
    }, [parentOnPageScrollStateChanged]);
    return (_jsxs(View, { testID: testID, style: [a.flex_1, native(a.overflow_hidden)], children: [renderTabBar({
                selectedPage: selectedPage,
                onSelect: onTabBarSelect,
                dragProgress: dragProgress,
                dragState: dragState,
            }), _jsx(DrawerGestureRequireFail, { children: _jsx(MemoizedAnimatedPagerView, { ref: pagerView, style: a.flex_1, initialPage: initialPage, onPageScroll: handlePageScroll, children: children }) })] }));
}
function DrawerGestureRequireFail(_a) {
    var children = _a.children;
    var drawerGesture = useContext(DrawerGestureContext);
    var nativeGesture = useMemo(function () {
        var gesture = Gesture.Native();
        if (drawerGesture) {
            gesture.requireExternalGestureToFail(drawerGesture);
        }
        return gesture;
    }, [drawerGesture]);
    return _jsx(GestureDetector, { gesture: nativeGesture, children: children });
}
function usePagerHandlers(handlers, dependencies) {
    var doDependenciesDiffer = useHandler(handlers, dependencies).doDependenciesDiffer;
    var subscribeForEvents = [
        'onPageScroll',
        'onPageScrollStateChanged',
        'onPageSelected',
    ];
    return useEvent(function (event) {
        'worklet';
        var onPageScroll = handlers.onPageScroll, onPageScrollStateChanged = handlers.onPageScrollStateChanged, onPageSelected = handlers.onPageSelected;
        if (event.eventName.endsWith('onPageScroll')) {
            onPageScroll(event);
        }
        else if (event.eventName.endsWith('onPageScrollStateChanged')) {
            onPageScrollStateChanged(event);
        }
        else if (event.eventName.endsWith('onPageSelected')) {
            onPageSelected(event);
        }
    }, subscribeForEvents, doDependenciesDiffer);
}
