var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useBreakpoints } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { Text } from '#/components/Typography';
import { FormContainer } from './FormContainer';
export var PasswordUpdatedForm = function (_a) {
    var onPressNext = _a.onPressNext;
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    return (_jsxs(FormContainer, { testID: "passwordUpdatedForm", style: [a.gap_2xl, !gtMobile && a.mt_5xl], children: [_jsx(Text, { style: [a.text_3xl, a.font_semi_bold, a.text_center], children: _jsx(Trans, { children: "Password updated!" }) }), _jsx(Text, { style: [a.text_center, a.mx_auto, { maxWidth: '80%' }], children: _jsx(Trans, { children: "You can now sign in with your new password." }) }), _jsx(View, { style: [a.flex_row, a.justify_center], children: _jsx(Button, { onPress: onPressNext, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Close alert"], ["Close alert"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Closes password update alert"], ["Closes password update alert"])))), variant: "solid", color: "primary", size: "large", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Okay" }) }) }) })] }));
};
var templateObject_1, templateObject_2;
