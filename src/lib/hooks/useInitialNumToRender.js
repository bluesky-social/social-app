import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomBarOffset } from '#/lib/hooks/useBottomBarOffset';
var MIN_POST_HEIGHT = 100;
export function useInitialNumToRender(_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.minItemHeight, minItemHeight = _c === void 0 ? MIN_POST_HEIGHT : _c, _d = _b.screenHeightOffset, screenHeightOffset = _d === void 0 ? 0 : _d;
    var screenHeight = useWindowDimensions().height;
    var topInset = useSafeAreaInsets().top;
    var bottomBarHeight = useBottomBarOffset();
    var finalHeight = screenHeight - screenHeightOffset - topInset - bottomBarHeight;
    var minItems = Math.floor(finalHeight / minItemHeight);
    if (minItems < 1) {
        return 1;
    }
    return minItems;
}
