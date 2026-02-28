import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, } from 'react-native-reanimated';
import { usePagerHeaderContext } from '#/view/com/pager/PagerHeaderContext';
import { IS_IOS } from '#/env';
export function GrowableAvatar(_a) {
    var children = _a.children, style = _a.style;
    var pagerContext = usePagerHeaderContext();
    // pagerContext should only be present on iOS, but better safe than sorry
    if (!pagerContext || !IS_IOS) {
        return _jsx(View, { style: style, children: children });
    }
    var scrollY = pagerContext.scrollY;
    return (_jsx(GrowableAvatarInner, { scrollY: scrollY, style: style, children: children }));
}
function GrowableAvatarInner(_a) {
    var scrollY = _a.scrollY, children = _a.children, style = _a.style;
    var animatedStyle = useAnimatedStyle(function () { return ({
        transform: [
            {
                scale: interpolate(scrollY.get(), [-150, 0], [1.2, 1], {
                    extrapolateRight: Extrapolation.CLAMP,
                }),
            },
        ],
    }); });
    return (_jsx(Animated.View, { style: [style, { transformOrigin: 'bottom left' }, animatedStyle], children: children }));
}
