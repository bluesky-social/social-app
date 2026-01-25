import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, { Extrapolation, interpolate, runOnJS, useAnimatedProps, useAnimatedReaction, useAnimatedStyle, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useIsFetching } from '@tanstack/react-query';
import { RQKEY_ROOT as STARTERPACK_RQKEY_ROOT } from '#/state/queries/actor-starter-packs';
import { RQKEY_ROOT as FEED_RQKEY_ROOT } from '#/state/queries/post-feed';
import { RQKEY_ROOT as FEEDGEN_RQKEY_ROOT } from '#/state/queries/profile-feedgens';
import { RQKEY_ROOT as LIST_RQKEY_ROOT } from '#/state/queries/profile-lists';
import { usePagerHeaderContext } from '#/view/com/pager/PagerHeaderContext';
import { atoms as a } from '#/alf';
import { IS_IOS } from '#/env';
var AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
export function GrowableBanner(_a) {
    var backButton = _a.backButton, children = _a.children, onPress = _a.onPress, bannerRef = _a.bannerRef;
    var pagerContext = usePagerHeaderContext();
    // plain non-growable mode for Android/Web
    if (!pagerContext || !IS_IOS) {
        return (_jsxs(Pressable, { onPress: onPress, accessibilityRole: "image", style: [a.w_full, a.h_full], children: [_jsx(Animated.View, { ref: bannerRef, style: [a.w_full, a.h_full], children: children }), backButton] }));
    }
    var scrollY = pagerContext.scrollY;
    return (_jsx(GrowableBannerInner, { scrollY: scrollY, backButton: backButton, onPress: onPress, bannerRef: bannerRef, children: children }));
}
function GrowableBannerInner(_a) {
    var scrollY = _a.scrollY, backButton = _a.backButton, children = _a.children, onPress = _a.onPress, bannerRef = _a.bannerRef;
    var topInset = useSafeAreaInsets().top;
    var isFetching = useIsProfileFetching();
    var animateSpinner = useShouldAnimateSpinner({ isFetching: isFetching, scrollY: scrollY });
    var animatedStyle = useAnimatedStyle(function () { return ({
        transform: [
            {
                scale: interpolate(scrollY.get(), [-150, 0], [2, 1], {
                    extrapolateRight: Extrapolation.CLAMP,
                }),
            },
        ],
    }); });
    var animatedBlurViewProps = useAnimatedProps(function () {
        return {
            intensity: interpolate(scrollY.get(), [-300, -65, -15], [50, 40, 0], Extrapolation.CLAMP),
        };
    });
    var animatedSpinnerStyle = useAnimatedStyle(function () {
        var scrollYValue = scrollY.get();
        return {
            display: scrollYValue < 0 ? 'flex' : 'none',
            opacity: interpolate(scrollYValue, [-60, -15], [1, 0], Extrapolation.CLAMP),
            transform: [
                { translateY: interpolate(scrollYValue, [-150, 0], [-75, 0]) },
                { rotate: '90deg' },
            ],
        };
    });
    var animatedBackButtonStyle = useAnimatedStyle(function () { return ({
        transform: [
            {
                translateY: interpolate(scrollY.get(), [-150, 10], [-150, 10], {
                    extrapolateRight: Extrapolation.CLAMP,
                }),
            },
        ],
    }); });
    return (_jsxs(_Fragment, { children: [_jsxs(Animated.View, { style: [
                    a.absolute,
                    { left: 0, right: 0, bottom: 0 },
                    { height: 150 },
                    { transformOrigin: 'bottom' },
                    animatedStyle,
                ], children: [_jsx(Pressable, { onPress: onPress, accessibilityRole: "image", style: [a.w_full, a.h_full], children: _jsx(Animated.View, { ref: bannerRef, collapsable: false, style: [a.w_full, a.h_full], children: children }) }), _jsx(AnimatedBlurView, { pointerEvents: "none", style: [a.absolute, a.inset_0], tint: "dark", animatedProps: animatedBlurViewProps })] }), _jsx(View, { pointerEvents: "none", style: [
                    a.absolute,
                    a.inset_0,
                    { top: topInset - (IS_IOS ? 15 : 0) },
                    a.justify_center,
                    a.align_center,
                ], children: _jsx(Animated.View, { style: [animatedSpinnerStyle], children: _jsx(ActivityIndicator, { size: "large", color: "white", animating: animateSpinner, hidesWhenStopped: false }, animateSpinner ? 'spin' : 'stop') }) }), _jsx(Animated.View, { style: [animatedBackButtonStyle], children: backButton })] }));
}
function useIsProfileFetching() {
    // are any of the profile-related queries fetching?
    return [
        useIsFetching({ queryKey: [FEED_RQKEY_ROOT] }),
        useIsFetching({ queryKey: [FEEDGEN_RQKEY_ROOT] }),
        useIsFetching({ queryKey: [LIST_RQKEY_ROOT] }),
        useIsFetching({ queryKey: [STARTERPACK_RQKEY_ROOT] }),
    ].some(function (isFetching) { return isFetching; });
}
function useShouldAnimateSpinner(_a) {
    var isFetching = _a.isFetching, scrollY = _a.scrollY;
    var _b = useState(false), isOverscrolled = _b[0], setIsOverscrolled = _b[1];
    // HACK: it reports a scroll pos of 0 for a tick when fetching finishes
    // so paper over that by keeping it true for a bit -sfn
    var stickyIsOverscrolled = useStickyToggle(isOverscrolled, 10);
    useAnimatedReaction(function () { return scrollY.get() < -5; }, function (value, prevValue) {
        if (value !== prevValue) {
            runOnJS(setIsOverscrolled)(value);
        }
    }, [scrollY]);
    var _c = useState(isFetching), isAnimating = _c[0], setIsAnimating = _c[1];
    if (isFetching && !isAnimating) {
        setIsAnimating(true);
    }
    if (!isFetching && isAnimating && !stickyIsOverscrolled) {
        setIsAnimating(false);
    }
    return isAnimating;
}
// stayed true for at least `delay` ms before returning to false
function useStickyToggle(value, delay) {
    var _a = useState(value), prevValue = _a[0], setPrevValue = _a[1];
    var _b = useState(false), isSticking = _b[0], setIsSticking = _b[1];
    useEffect(function () {
        if (isSticking) {
            var timeout_1 = setTimeout(function () { return setIsSticking(false); }, delay);
            return function () { return clearTimeout(timeout_1); };
        }
    }, [isSticking, delay]);
    if (value !== prevValue) {
        setIsSticking(prevValue); // Going true -> false should stick.
        setPrevValue(value);
        return prevValue ? true : value;
    }
    return isSticking ? true : value;
}
