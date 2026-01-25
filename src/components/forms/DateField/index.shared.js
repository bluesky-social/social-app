var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Pressable, View } from 'react-native';
import { useLingui } from '@lingui/react';
import { atoms as a, native, useTheme, web } from '#/alf';
import * as TextField from '#/components/forms/TextField';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { CalendarDays_Stroke2_Corner0_Rounded as CalendarDays } from '#/components/icons/CalendarDays';
import { Text } from '#/components/Typography';
// looks like a TextField.Input, but is just a button. It'll do something different on each platform on press
// iOS: open a dialog with an inline date picker
// Android: open the date picker modal
export function DateFieldButton(_a) {
    var label = _a.label, value = _a.value, onPress = _a.onPress, isInvalid = _a.isInvalid, accessibilityHint = _a.accessibilityHint;
    var i18n = useLingui().i18n;
    var t = useTheme();
    var _b = useInteractionState(), pressed = _b.state, onPressIn = _b.onIn, onPressOut = _b.onOut;
    var _c = useInteractionState(), hovered = _c.state, onHoverIn = _c.onIn, onHoverOut = _c.onOut;
    var _d = useInteractionState(), focused = _d.state, onFocus = _d.onIn, onBlur = _d.onOut;
    var _e = TextField.useSharedInputStyles(), chromeHover = _e.chromeHover, chromeFocus = _e.chromeFocus, chromeError = _e.chromeError, chromeErrorHover = _e.chromeErrorHover;
    return (_jsx(View, __assign({ style: [a.relative, a.w_full] }, web({
        onMouseOver: onHoverIn,
        onMouseOut: onHoverOut,
    }), { children: _jsxs(Pressable, { "aria-label": label, accessibilityLabel: label, accessibilityHint: accessibilityHint, onPress: onPress, onPressIn: onPressIn, onPressOut: onPressOut, onFocus: onFocus, onBlur: onBlur, style: [
                {
                    paddingLeft: 14,
                    paddingRight: 14,
                    borderColor: 'transparent',
                    borderWidth: 2,
                },
                native({
                    paddingTop: 10,
                    paddingBottom: 10,
                }),
                web(a.py_md),
                a.flex_row,
                a.flex_1,
                a.w_full,
                { borderRadius: 10 },
                t.atoms.bg_contrast_50,
                a.align_center,
                hovered ? chromeHover : {},
                focused || pressed ? chromeFocus : {},
                isInvalid || isInvalid ? chromeError : {},
                (isInvalid || isInvalid) && (hovered || focused)
                    ? chromeErrorHover
                    : {},
            ], children: [_jsx(TextField.Icon, { icon: CalendarDays }), _jsx(Text, { style: [
                        a.text_md,
                        a.pl_xs,
                        t.atoms.text,
                        { lineHeight: a.text_md.fontSize * 1.1875 },
                    ], children: i18n.date(value, { timeZone: 'UTC' }) })] }) })));
}
