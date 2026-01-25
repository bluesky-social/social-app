var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg, plural } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useTheme } from '#/alf';
import { Text } from '#/components/Typography';
/**
 * Absolutely positioned time indicator showing how many seconds are remaining
 * Time is in seconds
 */
export function TimeIndicator(_a) {
    var time = _a.time, style = _a.style;
    var t = useTheme();
    var _ = useLingui()._;
    if (isNaN(time)) {
        return null;
    }
    var minutes = Math.floor(time / 60);
    var seconds = String(time % 60).padStart(2, '0');
    return (_jsx(View, { pointerEvents: "none", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Time remaining: ", ""], ["Time remaining: ", ""])), plural(Number(time) || 0, {
            one: '# second',
            other: '# seconds',
        }))), accessibilityHint: "", style: [
            {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 3,
                left: 6,
                bottom: 6,
                minHeight: 21,
            },
            a.absolute,
            a.justify_center,
            style,
        ], children: _jsx(Text, { style: [
                { color: t.palette.white, fontSize: 12, fontVariant: ['tabular-nums'] },
                a.font_semi_bold,
                { lineHeight: 1.25 },
            ], children: "".concat(minutes, ":").concat(seconds) }) }));
}
var templateObject_1;
