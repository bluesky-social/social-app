import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMediaQuery } from 'react-responsive';
import { HITSLOP_20 } from '#/lib/constants';
import { PressableScale } from '#/lib/custom-animations/PressableScale';
import { useMinimalShellFabTransform } from '#/lib/hooks/useMinimalShellTransform';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { clamp } from '#/lib/numbers';
import { useSession } from '#/state/session';
import { atoms as a, useLayoutBreakpoints, useTheme, web } from '#/alf';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { ArrowTop_Stroke2_Corner0_Rounded as ArrowIcon } from '#/components/icons/Arrow';
import { CENTER_COLUMN_OFFSET } from '#/components/Layout';
import { SubtleHover } from '#/components/SubtleHover';
export function LoadLatestBtn(_a) {
    var onPress = _a.onPress, label = _a.label, showIndicator = _a.showIndicator;
    var hasSession = useSession().hasSession;
    var _b = useWebMediaQueries(), isDesktop = _b.isDesktop, isTablet = _b.isTablet, isMobile = _b.isMobile, isTabletOrMobile = _b.isTabletOrMobile;
    var centerColumnOffset = useLayoutBreakpoints().centerColumnOffset;
    var fabMinimalShellTransform = useMinimalShellFabTransform();
    var insets = useSafeAreaInsets();
    var t = useTheme();
    var _c = useInteractionState(), hovered = _c.state, onHoverIn = _c.onIn, onHoverOut = _c.onOut;
    // move button inline if it starts overlapping the left nav
    var isTallViewport = useMediaQuery({ minHeight: 700 });
    // Adjust height of the fab if we have a session only on mobile web. If we don't have a session, we want to adjust
    // it on both tablet and mobile since we are showing the bottom bar (see createNativeStackNavigatorWithAuth)
    var showBottomBar = hasSession ? isMobile : isTabletOrMobile;
    var bottomPosition = isTablet
        ? { bottom: 50 }
        : { bottom: clamp(insets.bottom, 15, 60) + 15 };
    return (_jsx(Animated.View, { testID: "loadLatestBtn", style: [
            a.fixed,
            a.z_20,
            { left: 18 },
            isDesktop &&
                (isTallViewport
                    ? styles.loadLatestOutOfLine
                    : styles.loadLatestInline),
            isTablet &&
                (centerColumnOffset
                    ? styles.loadLatestInlineOffset
                    : styles.loadLatestInline),
            bottomPosition,
            showBottomBar && fabMinimalShellTransform,
        ], children: _jsxs(PressableScale, { style: [
                {
                    width: 42,
                    height: 42,
                },
                a.rounded_full,
                a.align_center,
                a.justify_center,
                a.border,
                t.atoms.border_contrast_low,
                showIndicator ? { backgroundColor: t.palette.primary_50 } : t.atoms.bg,
            ], onPress: onPress, hitSlop: HITSLOP_20, accessibilityLabel: label, accessibilityHint: "", targetScale: 0.9, onPointerEnter: onHoverIn, onPointerLeave: onHoverOut, children: [_jsx(SubtleHover, { hover: hovered, style: [a.rounded_full] }), _jsx(ArrowIcon, { size: "md", style: [
                        a.z_10,
                        showIndicator
                            ? { color: t.palette.primary_500 }
                            : t.atoms.text_contrast_medium,
                    ] })] }) }));
}
var styles = StyleSheet.create({
    loadLatestInline: {
        left: web('calc(50vw - 282px)'),
    },
    loadLatestInlineOffset: {
        left: web("calc(50vw - 282px + ".concat(CENTER_COLUMN_OFFSET, "px)")),
    },
    loadLatestOutOfLine: {
        left: web('calc(50vw - 382px)'),
    },
});
