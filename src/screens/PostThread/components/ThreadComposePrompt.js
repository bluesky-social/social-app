var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { PressableScale } from '#/lib/custom-animations/PressableScale';
import { useHaptics } from '#/lib/haptics';
import { useHideBottomBarBorderForScreen } from '#/lib/hooks/useHideBottomBarBorder';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, ios, native, useBreakpoints, useTheme } from '#/alf';
import { transparentifyColor } from '#/alf/util/colorGeneration';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Text } from '#/components/Typography';
export function ThreadComposePrompt(_a) {
    var _b;
    var onPressCompose = _a.onPressCompose, style = _a.style;
    var currentAccount = useSession().currentAccount;
    var profile = useProfileQuery({ did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did }).data;
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var t = useTheme();
    var playHaptic = useHaptics();
    var _c = useInteractionState(), hovered = _c.state, onHoverIn = _c.onIn, onHoverOut = _c.onOut;
    useHideBottomBarBorderForScreen();
    return (_jsxs(View, { style: [
            a.px_sm,
            gtMobile
                ? [a.py_xs, a.border_t, t.atoms.border_contrast_low, t.atoms.bg]
                : [a.pb_2xs],
            style,
        ], children: [!gtMobile && (_jsx(LinearGradient, { start: [0.5, 0], end: [0.5, 1], colors: [
                    transparentifyColor(t.atoms.bg.backgroundColor, 0),
                    t.atoms.bg.backgroundColor,
                ], locations: [0.15, 0.4], style: [a.absolute, a.inset_0] }, t.name)), _jsxs(PressableScale, { accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Compose reply"], ["Compose reply"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Opens composer"], ["Opens composer"])))), onPress: function () {
                    onPressCompose();
                    playHaptic('Light');
                }, onLongPress: ios(function () {
                    onPressCompose();
                    playHaptic('Heavy');
                }), onHoverIn: onHoverIn, onHoverOut: onHoverOut, style: [
                    a.flex_row,
                    a.align_center,
                    a.p_sm,
                    a.gap_sm,
                    a.rounded_full,
                    (!gtMobile || hovered) && t.atoms.bg_contrast_25,
                    native([a.border, t.atoms.border_contrast_low]),
                    a.transition_color,
                ], children: [_jsx(UserAvatar, { size: 24, avatar: profile === null || profile === void 0 ? void 0 : profile.avatar, type: ((_b = profile === null || profile === void 0 ? void 0 : profile.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user' }), _jsx(Text, { style: [a.text_md, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Write your reply" }) })] })] }));
}
var templateObject_1, templateObject_2;
