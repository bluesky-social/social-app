var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { Text } from '#/components/Typography';
export function ErrorState(_a) {
    var error = _a.error;
    var t = useTheme();
    var _ = useLingui()._;
    var navigation = useNavigation();
    var onPressBack = React.useCallback(function () {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
        else {
            navigation.navigate('Home');
        }
    }, [navigation]);
    return (_jsxs(View, { style: [a.px_xl], children: [_jsx(CircleInfo, { width: 48, style: [t.atoms.text_contrast_low] }), _jsx(Text, { style: [a.text_xl, a.font_semi_bold, a.pb_md, a.pt_xl], children: _jsx(Trans, { children: "Hmmmm, we couldn't load that moderation service." }) }), _jsx(Text, { style: [
                    a.text_md,
                    a.leading_normal,
                    a.pb_md,
                    t.atoms.text_contrast_medium,
                ], children: _jsx(Trans, { children: "This moderation service is unavailable. See below for more details. If this issue persists, contact us." }) }), _jsx(View, { style: [
                    a.relative,
                    a.py_md,
                    a.px_lg,
                    a.rounded_md,
                    a.mb_2xl,
                    t.atoms.bg_contrast_25,
                ], children: _jsx(Text, { style: [a.text_md, a.leading_normal], children: error }) }), _jsx(View, { style: { flexDirection: 'row' }, children: _jsx(Button, { size: "small", color: "secondary", variant: "solid", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Go Back"], ["Go Back"])))), accessibilityHint: "Returns to previous page", onPress: onPressBack, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Go Back" }) }) }) })] }));
}
var templateObject_1;
