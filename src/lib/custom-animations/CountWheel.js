import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import Animated, { Easing, LayoutAnimationConfig, useReducedMotion, withTiming, } from 'react-native-reanimated';
import { decideShouldRoll } from '#/lib/custom-animations/util';
import { s } from '#/lib/styles';
import { Text } from '#/view/com/util/text/Text';
import { atoms as a, useTheme } from '#/alf';
import { useFormatPostStatCount } from '#/components/PostControls/util';
var animationConfig = {
    duration: 400,
    easing: Easing.out(Easing.cubic),
};
function EnteringUp() {
    'worklet';
    var animations = {
        opacity: withTiming(1, animationConfig),
        transform: [{ translateY: withTiming(0, animationConfig) }],
    };
    var initialValues = {
        opacity: 0,
        transform: [{ translateY: 18 }],
    };
    return {
        animations: animations,
        initialValues: initialValues,
    };
}
function EnteringDown() {
    'worklet';
    var animations = {
        opacity: withTiming(1, animationConfig),
        transform: [{ translateY: withTiming(0, animationConfig) }],
    };
    var initialValues = {
        opacity: 0,
        transform: [{ translateY: -18 }],
    };
    return {
        animations: animations,
        initialValues: initialValues,
    };
}
function ExitingUp() {
    'worklet';
    var animations = {
        opacity: withTiming(0, animationConfig),
        transform: [
            {
                translateY: withTiming(-18, animationConfig),
            },
        ],
    };
    var initialValues = {
        opacity: 1,
        transform: [{ translateY: 0 }],
    };
    return {
        animations: animations,
        initialValues: initialValues,
    };
}
function ExitingDown() {
    'worklet';
    var animations = {
        opacity: withTiming(0, animationConfig),
        transform: [{ translateY: withTiming(18, animationConfig) }],
    };
    var initialValues = {
        opacity: 1,
        transform: [{ translateY: 0 }],
    };
    return {
        animations: animations,
        initialValues: initialValues,
    };
}
export function CountWheel(_a) {
    var likeCount = _a.likeCount, big = _a.big, isLiked = _a.isLiked, hasBeenToggled = _a.hasBeenToggled;
    var t = useTheme();
    var shouldAnimate = !useReducedMotion() && hasBeenToggled;
    var shouldRoll = decideShouldRoll(isLiked, likeCount);
    // Incrementing the key will cause the `Animated.View` to re-render, with the newly selected entering/exiting
    // animation
    // The initial entering/exiting animations will get skipped, since these will happen on screen mounts and would
    // be unnecessary
    var _b = React.useState(0), key = _b[0], setKey = _b[1];
    var _c = React.useState(likeCount), prevCount = _c[0], setPrevCount = _c[1];
    var prevIsLiked = React.useRef(isLiked);
    var formatPostStatCount = useFormatPostStatCount();
    var formattedCount = formatPostStatCount(likeCount);
    var formattedPrevCount = formatPostStatCount(prevCount);
    React.useEffect(function () {
        if (isLiked === prevIsLiked.current) {
            return;
        }
        var newPrevCount = isLiked ? likeCount - 1 : likeCount + 1;
        setKey(function (prev) { return prev + 1; });
        setPrevCount(newPrevCount);
        prevIsLiked.current = isLiked;
    }, [isLiked, likeCount]);
    var enteringAnimation = shouldAnimate && shouldRoll
        ? isLiked
            ? EnteringUp
            : EnteringDown
        : undefined;
    var exitingAnimation = shouldAnimate && shouldRoll
        ? isLiked
            ? ExitingUp
            : ExitingDown
        : undefined;
    return (_jsx(LayoutAnimationConfig, { skipEntering: true, skipExiting: true, children: likeCount > 0 ? (_jsxs(View, { style: [a.justify_center], children: [_jsx(Animated.View, { entering: enteringAnimation, children: _jsx(Text, { testID: "likeCount", style: [
                            big ? a.text_md : a.text_sm,
                            a.user_select_none,
                            isLiked
                                ? [a.font_semi_bold, s.likeColor]
                                : { color: t.palette.contrast_500 },
                        ], children: formattedCount }) }, key), shouldAnimate && (likeCount > 1 || !isLiked) ? (_jsx(Animated.View, { entering: exitingAnimation, style: [a.absolute, { width: 50, opacity: 0 }], "aria-disabled": true, children: _jsx(Text, { style: [
                            big ? a.text_md : a.text_sm,
                            a.user_select_none,
                            isLiked
                                ? [a.font_semi_bold, s.likeColor]
                                : { color: t.palette.contrast_500 },
                        ], children: formattedPrevCount }) }, key + 2)) : null] })) : null }));
}
