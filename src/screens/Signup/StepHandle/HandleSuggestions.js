import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Animated, { Easing, FadeInDown, FadeOut } from 'react-native-reanimated';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, native, useTheme } from '#/alf';
import { borderRadius } from '#/alf/tokens';
import { Button } from '#/components/Button';
import { Text } from '#/components/Typography';
export function HandleSuggestions(_a) {
    var suggestions = _a.suggestions, onSelect = _a.onSelect;
    var t = useTheme();
    var _ = useLingui()._;
    return (_jsx(Animated.View, { entering: native(FadeInDown.easing(Easing.out(Easing.exp))), exiting: native(FadeOut), style: [
            a.flex_1,
            a.border,
            a.rounded_sm,
            t.atoms.shadow_sm,
            t.atoms.bg,
            t.atoms.border_contrast_low,
            a.mt_xs,
            a.z_50,
            a.w_full,
            a.zoom_fade_in,
        ], children: suggestions.map(function (suggestion, index) { return (_jsxs(Button, { label: _(msg({
                message: "Select ".concat(suggestion.handle),
                comment: "Accessibility label for a username suggestion in the account creation flow",
            })), onPress: function () { return onSelect(suggestion); }, hoverStyle: [t.atoms.bg_contrast_25], style: [
                a.w_full,
                a.flex_row,
                a.align_center,
                a.justify_between,
                a.p_md,
                a.border_b,
                t.atoms.border_contrast_low,
                index === 0 && {
                    borderTopStartRadius: borderRadius.sm,
                    borderTopEndRadius: borderRadius.sm,
                },
                index === suggestions.length - 1 && [
                    {
                        borderBottomStartRadius: borderRadius.sm,
                        borderBottomEndRadius: borderRadius.sm,
                    },
                    a.border_b_0,
                ],
            ], children: [_jsx(Text, { style: [a.text_md], children: suggestion.handle }), _jsx(Text, { style: [a.text_sm, { color: t.palette.positive_700 }], children: _jsx(Trans, { comment: "Shown next to an available username suggestion in the account creation flow", children: "Available" }) })] }, index)); }) }));
}
