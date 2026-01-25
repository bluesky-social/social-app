var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { Pressable, TextInput, View, } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { mergeRefs } from '#/lib/merge-refs';
import { atoms as a, ios, platform, useTheme } from '#/alf';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Text } from '#/components/Typography';
import { IS_ANDROID, IS_IOS } from '#/env';
export function OTPInput(_a) {
    var label = _a.label, value = _a.value, onChange = _a.onChange, ref = _a.ref, _b = _a.numberOfDigits, numberOfDigits = _b === void 0 ? 6 : _b, onComplete = _a.onComplete;
    var t = useTheme();
    var _ = useLingui()._;
    var innerRef = useRef(null);
    var _c = useInteractionState(), focused = _c.state, onFocus = _c.onIn, onBlur = _c.onOut;
    var _d = useState({ start: 0, end: 0 }), selection = _d[0], setSelection = _d[1];
    var onChangeText = function (text) {
        var _a;
        // only numbers
        text = text.replace(/[^0-9]/g, '');
        text = text.slice(0, numberOfDigits);
        onChange(text);
        if (text.length === numberOfDigits) {
            onComplete === null || onComplete === void 0 ? void 0 : onComplete(text);
            (_a = innerRef.current) === null || _a === void 0 ? void 0 : _a.blur();
        }
    };
    var onSelectionChange = function (evt) {
        setSelection(evt.nativeEvent.selection);
    };
    return (_jsxs(Pressable, { accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Focus code input"], ["Focus code input"])))), accessibilityRole: "button", accessibilityHint: "", style: [a.w_full, a.relative], onPress: function () {
            var _a, _b;
            (_a = innerRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            (_b = innerRef.current) === null || _b === void 0 ? void 0 : _b.clear();
        }, children: [_jsx(View, { style: [a.w_full, a.flex_row, a.gap_sm], children: __spreadArray([], value.padEnd(numberOfDigits, ' '), true).map(function (digit, index) {
                    var selected = focused
                        ? selection.start === selection.end
                            ? selection.start === index
                            : index >= selection.start && index < selection.end
                        : false;
                    return (_jsx(View, { style: [
                            a.flex_1,
                            a.align_center,
                            a.justify_center,
                            t.atoms.bg_contrast_50,
                            {
                                height: 64,
                                borderWidth: 1,
                                borderRadius: 10,
                                borderColor: selected
                                    ? t.palette.primary_500
                                    : t.atoms.bg_contrast_50.backgroundColor,
                            },
                        ], children: _jsx(Text, { style: [a.text_2xl, a.text_center, a.font_bold], children: digit }) }, index));
                }) }), _jsx(TextInput
            // SMS autofill is borked on iOS if you open the keyboard immediately -sfn
            , { 
                // SMS autofill is borked on iOS if you open the keyboard immediately -sfn
                onLayout: ios(function () { return setTimeout(function () { var _a; return (_a = innerRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 100); }), autoFocus: IS_ANDROID, accessible: true, accessibilityLabel: label, accessibilityHint: "", accessibilityRole: "text", ref: mergeRefs(ref ? [ref, innerRef] : [innerRef]), value: value, onChangeText: onChangeText, onSelectionChange: onSelectionChange, keyboardAppearance: t.scheme, inputMode: "numeric", keyboardType: "number-pad", textContentType: "oneTimeCode", autoComplete: platform({
                    android: 'sms-otp',
                    ios: 'one-time-code',
                }), onFocus: onFocus, onBlur: onBlur, maxLength: numberOfDigits, style: [
                    a.absolute,
                    a.inset_0,
                    // roughly vibe align the characters
                    // with the visible ones so that
                    // moving the caret via long press
                    // still kinda sorta works
                    {
                        fontVariant: ['tabular-nums'],
                        textAlignVertical: 'center',
                        letterSpacing: 24,
                        fontSize: 60,
                        paddingLeft: 6,
                    },
                    platform({
                        // completely transparent inputs on iOS cannot be pasted into
                        ios: { opacity: 0.02, color: 'transparent' },
                        android: { opacity: 0 },
                    }),
                ], caretHidden: IS_IOS, clearTextOnFocus: true })] }));
}
var templateObject_1;
