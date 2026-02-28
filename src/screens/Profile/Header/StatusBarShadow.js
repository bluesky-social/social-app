import { jsx as _jsx } from "react/jsx-runtime";
import Animated, { useAnimatedStyle, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePagerHeaderContext } from '#/view/com/pager/PagerHeaderContext';
import { atoms as a } from '#/alf';
import { IS_IOS } from '#/env';
var AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
export function StatusBarShadow() {
    var topInset = useSafeAreaInsets().top;
    var pagerContext = usePagerHeaderContext();
    if (IS_IOS && pagerContext) {
        var scrollY_1 = pagerContext.scrollY;
        return _jsx(StatusBarShadowInnner, { scrollY: scrollY_1 });
    }
    return (_jsx(LinearGradient, { colors: ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)'], style: [
            a.absolute,
            a.z_10,
            { height: topInset, top: 0, left: 0, right: 0 },
        ] }));
}
function StatusBarShadowInnner(_a) {
    var scrollY = _a.scrollY;
    var topInset = useSafeAreaInsets().top;
    var animatedStyle = useAnimatedStyle(function () {
        return {
            transform: [
                {
                    translateY: Math.min(0, scrollY.get()),
                },
            ],
        };
    });
    return (_jsx(AnimatedLinearGradient, { colors: ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)'], style: [
            animatedStyle,
            a.absolute,
            a.z_10,
            { height: topInset, top: 0, left: 0, right: 0 },
        ] }));
}
