import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import Animated, { Keyframe, LayoutAnimationConfig, useReducedMotion, } from 'react-native-reanimated';
import { s } from '#/lib/styles';
import { useTheme } from '#/alf';
import { Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled, Heart2_Stroke2_Corner0_Rounded as HeartIconOutline, } from '#/components/icons/Heart2';
var keyframe = new Keyframe({
    0: {
        transform: [{ scale: 1 }],
    },
    10: {
        transform: [{ scale: 0.7 }],
    },
    40: {
        transform: [{ scale: 1.2 }],
    },
    100: {
        transform: [{ scale: 1 }],
    },
});
var circle1Keyframe = new Keyframe({
    0: {
        opacity: 0,
        transform: [{ scale: 0 }],
    },
    10: {
        opacity: 0.4,
    },
    40: {
        transform: [{ scale: 1.5 }],
    },
    95: {
        opacity: 0.4,
    },
    100: {
        opacity: 0,
        transform: [{ scale: 1.5 }],
    },
});
var circle2Keyframe = new Keyframe({
    0: {
        opacity: 0,
        transform: [{ scale: 0 }],
    },
    10: {
        opacity: 1,
    },
    40: {
        transform: [{ scale: 0 }],
    },
    95: {
        opacity: 1,
    },
    100: {
        opacity: 0,
        transform: [{ scale: 1.5 }],
    },
});
export function AnimatedLikeIcon(_a) {
    var isLiked = _a.isLiked, big = _a.big, hasBeenToggled = _a.hasBeenToggled;
    var t = useTheme();
    var size = big ? 22 : 18;
    var shouldAnimate = !useReducedMotion() && hasBeenToggled;
    return (_jsx(View, { children: _jsxs(LayoutAnimationConfig, { skipEntering: true, children: [isLiked ? (_jsx(Animated.View, { entering: shouldAnimate ? keyframe.duration(300) : undefined, children: _jsx(HeartIconFilled, { style: s.likeColor, width: size }) })) : (_jsx(HeartIconOutline, { style: [{ color: t.palette.contrast_500 }, { pointerEvents: 'none' }], width: size })), isLiked && shouldAnimate ? (_jsxs(_Fragment, { children: [_jsx(Animated.View, { entering: circle1Keyframe.duration(300), style: {
                                position: 'absolute',
                                backgroundColor: s.likeColor.color,
                                top: 0,
                                left: 0,
                                width: size,
                                height: size,
                                zIndex: -1,
                                pointerEvents: 'none',
                                borderRadius: size / 2,
                            } }), _jsx(Animated.View, { entering: circle2Keyframe.duration(300), style: {
                                position: 'absolute',
                                backgroundColor: t.atoms.bg.backgroundColor,
                                top: 0,
                                left: 0,
                                width: size,
                                height: size,
                                zIndex: -1,
                                pointerEvents: 'none',
                                borderRadius: size / 2,
                            } })] })) : null] }) }));
}
