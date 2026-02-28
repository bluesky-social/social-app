var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import * as TextField from '#/components/forms/TextField';
import { Shield_Stroke2_Corner0_Rounded as Shield } from '#/components/icons/Shield';
export function normalizeCode(value) {
    var normalized = value.toUpperCase().replace(/[^A-Z2-7]/g, '');
    if (normalized.length <= 5)
        return normalized;
    return "".concat(normalized.slice(0, 5), "-").concat(normalized.slice(5));
}
export function isValidCode(value) {
    return Boolean(value && /^[A-Z2-7]{5}-[A-Z2-7]{5}$/.test(value));
}
export function TokenField(_a) {
    var value = _a.value, onChangeText = _a.onChangeText, onSubmitEditing = _a.onSubmitEditing;
    var _ = useLingui()._;
    var isInvalid = Boolean(value && value.length > 10 && !isValidCode(value));
    var handleOnChangeText = function (v) {
        onChangeText === null || onChangeText === void 0 ? void 0 : onChangeText(normalizeCode(v));
    };
    return (_jsx(View, { children: _jsxs(TextField.Root, { children: [_jsx(TextField.Icon, { icon: Shield }), _jsx(TextField.Input, { autoComplete: "off", autoCorrect: false, isInvalid: isInvalid, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Confirmation code"], ["Confirmation code"])))), maxLength: 11, placeholder: "XXXXX-XXXXX", value: value, onChangeText: handleOnChangeText, onSubmitEditing: onSubmitEditing })] }) }));
}
var templateObject_1;
