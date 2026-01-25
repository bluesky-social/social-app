import { useWindowDimensions } from 'react-native';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
export function useHeaderOffset() {
    var _a = useWebMediaQueries(), isDesktop = _a.isDesktop, isTablet = _a.isTablet;
    var fontScale = useWindowDimensions().fontScale;
    if (isDesktop || isTablet) {
        return 0;
    }
    var navBarHeight = 52;
    var tabBarPad = 10 + 10 + 3; // padding + border
    var normalLineHeight = 20; // matches tab bar
    var tabBarText = normalLineHeight * fontScale;
    return navBarHeight + tabBarPad + tabBarText - 4; // for some reason, this calculation is wrong by 4 pixels, which we adjust
}
