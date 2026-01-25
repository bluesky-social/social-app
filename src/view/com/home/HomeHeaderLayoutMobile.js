var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { HITSLOP_10 } from '#/lib/constants';
import { PressableScale } from '#/lib/custom-animations/PressableScale';
import { useHaptics } from '#/lib/haptics';
import { useMinimalShellHeaderTransform } from '#/lib/hooks/useMinimalShellTransform';
import { emitSoftReset } from '#/state/events';
import { useSession } from '#/state/session';
import { useShellLayout } from '#/state/shell/shell-layout';
import { Logo } from '#/view/icons/Logo';
import { atoms as a, useTheme } from '#/alf';
import { ButtonIcon } from '#/components/Button';
import { Hashtag_Stroke2_Corner0_Rounded as FeedsIcon } from '#/components/icons/Hashtag';
import * as Layout from '#/components/Layout';
import { Link } from '#/components/Link';
export function HomeHeaderLayoutMobile(_a) {
    var children = _a.children;
    var t = useTheme();
    var _ = useLingui()._;
    var headerHeight = useShellLayout().headerHeight;
    var headerMinimalShellTransform = useMinimalShellHeaderTransform();
    var hasSession = useSession().hasSession;
    var playHaptic = useHaptics();
    return (_jsxs(Animated.View, { style: [
            a.fixed,
            a.z_10,
            t.atoms.bg,
            {
                top: 0,
                left: 0,
                right: 0,
            },
            headerMinimalShellTransform,
        ], onLayout: function (e) {
            headerHeight.set(e.nativeEvent.layout.height);
        }, children: [_jsxs(Layout.Header.Outer, { noBottomBorder: true, children: [_jsx(Layout.Header.Slot, { children: _jsx(Layout.Header.MenuButton, {}) }), _jsx(View, { style: [a.flex_1, a.align_center], children: _jsx(PressableScale, { targetScale: 0.9, onPress: function () {
                                playHaptic('Light');
                                emitSoftReset();
                            }, children: _jsx(Logo, { width: 30 }) }) }), _jsx(Layout.Header.Slot, { children: hasSession && (_jsx(Link, { testID: "viewHeaderHomeFeedPrefsBtn", to: { screen: 'Feeds' }, hitSlop: HITSLOP_10, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["View your feeds and explore more"], ["View your feeds and explore more"])))), size: "small", variant: "ghost", color: "secondary", shape: "square", style: [
                                a.justify_center,
                                { marginRight: -Layout.BUTTON_VISUAL_ALIGNMENT_OFFSET },
                                a.bg_transparent,
                            ], children: _jsx(ButtonIcon, { icon: FeedsIcon, size: "lg" }) })) })] }), children] }));
}
var templateObject_1;
