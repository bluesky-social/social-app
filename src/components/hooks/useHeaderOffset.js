import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoints } from '#/alf';
import { IS_LIQUID_GLASS } from '#/env';
export function useHeaderOffset() {
    var gtMobile = useBreakpoints().gtMobile;
    var fontScale = useWindowDimensions().fontScale;
    var insets = useSafeAreaInsets();
    if (gtMobile) {
        return 0;
    }
    var navBarHeight = 52 + (IS_LIQUID_GLASS ? insets.top : 0);
    var tabBarPad = 10 + 10 + 3; // padding + border
    var normalLineHeight = 20; // matches tab bar
    var tabBarText = normalLineHeight * fontScale;
    return navBarHeight + tabBarPad + tabBarText - 4; // for some reason, this calculation is wrong by 4 pixels, which we adjust
}
