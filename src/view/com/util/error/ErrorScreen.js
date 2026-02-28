var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { FontAwesomeIcon, } from '@fortawesome/react-native-fontawesome';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { usePalette } from '#/lib/hooks/usePalette';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon } from '#/components/icons/ArrowRotate';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';
export function ErrorScreen(_a) {
    var title = _a.title, message = _a.message, details = _a.details, onPressTryAgain = _a.onPressTryAgain, testID = _a.testID, showHeader = _a.showHeader;
    var t = useTheme();
    var pal = usePalette('default');
    var _ = useLingui()._;
    return (_jsxs(Layout.Center, { testID: testID, children: [showHeader && (_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Error" }) }) }), _jsx(Layout.Header.Slot, {})] })), _jsxs(View, { style: [a.px_xl, a.py_2xl], children: [_jsx(View, { style: [a.mb_md, a.align_center], children: _jsx(View, { style: [
                                a.rounded_full,
                                { width: 50, height: 50 },
                                a.align_center,
                                a.justify_center,
                                { backgroundColor: t.palette.contrast_950 },
                            ], children: _jsx(FontAwesomeIcon, { icon: "exclamation", style: pal.textInverted, size: 24 }) }) }), _jsx(Text, { style: [a.text_center, a.font_bold, a.text_2xl, a.mb_md], children: title }), _jsx(Text, { style: [a.text_center, a.text_md, a.mb_xl], children: message }), details && (_jsx(View, { style: [
                            a.w_full,
                            a.border,
                            t.atoms.border_contrast_medium,
                            t.atoms.bg_contrast_25,
                            a.mb_xl,
                            a.py_sm,
                            a.px_lg,
                            a.rounded_xs,
                            a.overflow_hidden,
                        ], children: _jsx(Text, { testID: "".concat(testID, "-details"), style: [a.text_center, a.text_md, t.atoms.text_contrast_high], children: details }) })), onPressTryAgain && (_jsx(View, { style: [a.align_center], children: _jsxs(Button, { testID: "errorScreenTryAgainButton", onPress: onPressTryAgain, variant: "solid", color: "secondary_inverted", size: "small", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Retry"], ["Retry"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Retries the last action, which errored out"], ["Retries the last action, which errored out"])))), children: [_jsx(ButtonIcon, { icon: ArrowRotateCounterClockwiseIcon }), _jsx(ButtonText, { children: _jsx(Trans, { context: "action", children: "Try again" }) })] }) }))] })] }));
}
var templateObject_1, templateObject_2;
