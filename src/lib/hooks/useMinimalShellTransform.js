import { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMinimalShellMode } from '#/state/shell/minimal-mode';
import { useShellLayout } from '#/state/shell/shell-layout';
import { IS_LIQUID_GLASS } from '#/env';
// Keep these separated so that we only pay for useAnimatedStyle that gets used.
export function useMinimalShellHeaderTransform() {
    var headerMode = useMinimalShellMode().headerMode;
    var headerHeight = useShellLayout().headerHeight;
    var topInset = useSafeAreaInsets().top;
    var headerPinnedHeight = IS_LIQUID_GLASS ? topInset : 0;
    var headerTransform = useAnimatedStyle(function () {
        var headerModeValue = headerMode.get();
        return {
            pointerEvents: headerModeValue === 0 ? 'auto' : 'none',
            opacity: Math.pow(1 - headerModeValue, 2),
            transform: [
                {
                    translateY: interpolate(headerModeValue, [0, 1], [0, headerPinnedHeight - headerHeight.get()]),
                },
            ],
        };
    });
    return headerTransform;
}
export function useMinimalShellFooterTransform() {
    var footerMode = useMinimalShellMode().footerMode;
    var footerHeight = useShellLayout().footerHeight;
    var footerTransform = useAnimatedStyle(function () {
        var footerModeValue = footerMode.get();
        return {
            pointerEvents: footerModeValue === 0 ? 'auto' : 'none',
            opacity: Math.pow(1 - footerModeValue, 2),
            transform: [
                {
                    translateY: interpolate(footerModeValue, [0, 1], [0, footerHeight.get()]),
                },
            ],
        };
    });
    return footerTransform;
}
export function useMinimalShellFabTransform() {
    var footerMode = useMinimalShellMode().footerMode;
    var fabTransform = useAnimatedStyle(function () {
        return {
            transform: [
                {
                    translateY: interpolate(footerMode.get(), [0, 1], [-44, 0]),
                },
            ],
        };
    });
    return fabTransform;
}
