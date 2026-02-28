import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { s } from '#/lib/styles';
import { useTheme } from '#/alf';
import { Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled, Heart2_Stroke2_Corner0_Rounded as HeartIconOutline, } from '#/components/icons/Heart2';
var animationConfig = {
    duration: 600,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fill: 'forwards',
};
var keyframe = [
    { transform: 'scale(1)' },
    { transform: 'scale(0.7)' },
    { transform: 'scale(1.2)' },
    { transform: 'scale(1)' },
];
var circle1Keyframe = [
    { opacity: 0, transform: 'scale(0)' },
    { opacity: 0.4 },
    { transform: 'scale(1.5)' },
    { opacity: 0.4 },
    { opacity: 0, transform: 'scale(1.5)' },
];
var circle2Keyframe = [
    { opacity: 0, transform: 'scale(0)' },
    { opacity: 1 },
    { transform: 'scale(0)' },
    { opacity: 1 },
    { opacity: 0, transform: 'scale(1.5)' },
];
export function AnimatedLikeIcon(_a) {
    var isLiked = _a.isLiked, big = _a.big, hasBeenToggled = _a.hasBeenToggled;
    var t = useTheme();
    var size = big ? 22 : 18;
    var shouldAnimate = !useReducedMotion() && hasBeenToggled;
    var prevIsLiked = React.useRef(isLiked);
    var likeIconRef = React.useRef(null);
    var circle1Ref = React.useRef(null);
    var circle2Ref = React.useRef(null);
    React.useEffect(function () {
        var _a, _b, _c, _d, _e, _f;
        if (prevIsLiked.current === isLiked) {
            return;
        }
        if (shouldAnimate && isLiked) {
            (_b = (_a = likeIconRef.current) === null || _a === void 0 ? void 0 : _a.animate) === null || _b === void 0 ? void 0 : _b.call(_a, keyframe, animationConfig);
            (_d = (_c = circle1Ref.current) === null || _c === void 0 ? void 0 : _c.animate) === null || _d === void 0 ? void 0 : _d.call(_c, circle1Keyframe, animationConfig);
            (_f = (_e = circle2Ref.current) === null || _e === void 0 ? void 0 : _e.animate) === null || _f === void 0 ? void 0 : _f.call(_e, circle2Keyframe, animationConfig);
        }
        prevIsLiked.current = isLiked;
    }, [shouldAnimate, isLiked]);
    return (_jsxs(View, { children: [isLiked ? (
            // @ts-expect-error is div
            _jsx(View, { ref: likeIconRef, children: _jsx(HeartIconFilled, { style: s.likeColor, width: size }) })) : (_jsx(HeartIconOutline, { style: [{ color: t.palette.contrast_500 }, { pointerEvents: 'none' }], width: size })), _jsx(View
            // @ts-expect-error is div
            , { 
                // @ts-expect-error is div
                ref: circle1Ref, style: {
                    position: 'absolute',
                    backgroundColor: s.likeColor.color,
                    top: 0,
                    left: 0,
                    width: size,
                    height: size,
                    zIndex: -1,
                    pointerEvents: 'none',
                    borderRadius: size / 2,
                    opacity: 0,
                } }), _jsx(View
            // @ts-expect-error is div
            , { 
                // @ts-expect-error is div
                ref: circle2Ref, style: {
                    position: 'absolute',
                    backgroundColor: t.atoms.bg.backgroundColor,
                    top: 0,
                    left: 0,
                    width: size,
                    height: size,
                    zIndex: -1,
                    pointerEvents: 'none',
                    borderRadius: size / 2,
                    opacity: 0,
                } })] }));
}
