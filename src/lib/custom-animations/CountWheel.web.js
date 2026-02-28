import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { decideShouldRoll } from '#/lib/custom-animations/util';
import { s } from '#/lib/styles';
import { Text } from '#/view/com/util/text/Text';
import { atoms as a, useTheme } from '#/alf';
import { useFormatPostStatCount } from '#/components/PostControls/util';
var animationConfig = {
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fill: 'forwards',
};
var enteringUpKeyframe = [
    { opacity: 0, transform: 'translateY(18px)' },
    { opacity: 1, transform: 'translateY(0)' },
];
var enteringDownKeyframe = [
    { opacity: 0, transform: 'translateY(-18px)' },
    { opacity: 1, transform: 'translateY(0)' },
];
var exitingUpKeyframe = [
    { opacity: 1, transform: 'translateY(0)' },
    { opacity: 0, transform: 'translateY(-18px)' },
];
var exitingDownKeyframe = [
    { opacity: 1, transform: 'translateY(0)' },
    { opacity: 0, transform: 'translateY(18px)' },
];
export function CountWheel(_a) {
    var likeCount = _a.likeCount, big = _a.big, isLiked = _a.isLiked, hasBeenToggled = _a.hasBeenToggled;
    var t = useTheme();
    var shouldAnimate = !useReducedMotion() && hasBeenToggled;
    var shouldRoll = decideShouldRoll(isLiked, likeCount);
    var countView = React.useRef(null);
    var prevCountView = React.useRef(null);
    var _b = React.useState(likeCount), prevCount = _b[0], setPrevCount = _b[1];
    var prevIsLiked = React.useRef(isLiked);
    var formatPostStatCount = useFormatPostStatCount();
    var formattedCount = formatPostStatCount(likeCount);
    var formattedPrevCount = formatPostStatCount(prevCount);
    React.useEffect(function () {
        var _a, _b, _c, _d;
        if (isLiked === prevIsLiked.current) {
            return;
        }
        var newPrevCount = isLiked ? likeCount - 1 : likeCount + 1;
        if (shouldAnimate && shouldRoll) {
            (_b = (_a = countView.current) === null || _a === void 0 ? void 0 : _a.animate) === null || _b === void 0 ? void 0 : _b.call(_a, isLiked ? enteringUpKeyframe : enteringDownKeyframe, animationConfig);
            (_d = (_c = prevCountView.current) === null || _c === void 0 ? void 0 : _c.animate) === null || _d === void 0 ? void 0 : _d.call(_c, isLiked ? exitingUpKeyframe : exitingDownKeyframe, animationConfig);
            setPrevCount(newPrevCount);
        }
        prevIsLiked.current = isLiked;
    }, [isLiked, likeCount, shouldAnimate, shouldRoll]);
    if (likeCount < 1) {
        return null;
    }
    return (_jsxs(View, { children: [_jsx(View
            // @ts-expect-error is div
            , { 
                // @ts-expect-error is div
                ref: countView, children: _jsx(Text, { testID: "likeCount", style: [
                        big ? a.text_md : a.text_sm,
                        a.user_select_none,
                        isLiked
                            ? [a.font_semi_bold, s.likeColor]
                            : { color: t.palette.contrast_500 },
                    ], children: formattedCount }) }), shouldAnimate && (likeCount > 1 || !isLiked) ? (_jsx(View, { style: { position: 'absolute', opacity: 0 }, "aria-disabled": true, 
                // @ts-expect-error is div
                ref: prevCountView, children: _jsx(Text, { style: [
                        big ? a.text_md : a.text_sm,
                        a.user_select_none,
                        isLiked
                            ? [a.font_semi_bold, s.likeColor]
                            : { color: t.palette.contrast_500 },
                    ], children: formattedPrevCount }) })) : null] }));
}
