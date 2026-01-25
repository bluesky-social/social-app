import { useMemo } from 'react';
import { useMediaQuery } from 'react-responsive';
export function useBreakpoints() {
    var gtPhone = useMediaQuery({ minWidth: 500 });
    var gtMobile = useMediaQuery({ minWidth: 800 });
    var gtTablet = useMediaQuery({ minWidth: 1300 });
    return useMemo(function () {
        var active;
        if (gtTablet) {
            active = 'gtTablet';
        }
        else if (gtMobile) {
            active = 'gtMobile';
        }
        else if (gtPhone) {
            active = 'gtPhone';
        }
        return {
            activeBreakpoint: active,
            gtPhone: gtPhone,
            gtMobile: gtMobile,
            gtTablet: gtTablet,
        };
    }, [gtPhone, gtMobile, gtTablet]);
}
/**
 * Fine-tuned breakpoints for the shell layout
 */
export function useLayoutBreakpoints() {
    var rightNavVisible = useMediaQuery({ minWidth: 1100 });
    var centerColumnOffset = useMediaQuery({ minWidth: 1100, maxWidth: 1300 });
    var leftNavMinimal = useMediaQuery({ maxWidth: 1300 });
    return {
        rightNavVisible: rightNavVisible,
        centerColumnOffset: centerColumnOffset,
        leftNavMinimal: leftNavMinimal,
    };
}
