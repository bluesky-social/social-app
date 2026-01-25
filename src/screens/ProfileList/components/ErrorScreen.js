var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { Text } from '#/components/Typography';
export function ErrorScreen(_a) {
    var error = _a.error;
    var t = useTheme();
    var navigation = useNavigation();
    var _ = useLingui()._;
    var onPressBack = function () {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
        else {
            navigation.navigate('Home');
        }
    };
    return (_jsxs(View, { style: [a.px_xl, a.py_md, a.gap_md], children: [_jsx(Text, { style: [a.text_4xl, a.font_bold], children: _jsx(Trans, { children: "Could not load list" }) }), _jsx(Text, { style: [a.text_md, t.atoms.text_contrast_high, a.leading_snug], children: error }), _jsx(View, { style: [a.flex_row, a.mt_lg], children: _jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Go back"], ["Go back"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Returns to previous page"], ["Returns to previous page"])))), onPress: onPressBack, size: "small", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Go back" }) }) }) })] }));
}
var templateObject_1, templateObject_2;
