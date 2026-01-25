import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { clamp } from '#/lib/numbers';
import { IS_WEB } from '#/env';
export function useBottomBarOffset(modifier) {
    if (modifier === void 0) { modifier = 0; }
    var isTabletOrDesktop = useWebMediaQueries().isTabletOrDesktop;
    var bottomInset = useSafeAreaInsets().bottom;
    return ((IS_WEB && isTabletOrDesktop ? 0 : clamp(60 + bottomInset, 60, 75)) +
        modifier);
}
