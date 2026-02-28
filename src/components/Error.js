var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useGoBack } from '#/lib/hooks/useGoBack';
import { CenteredView } from '#/view/com/util/Views';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { Text } from '#/components/Typography';
export function Error(_a) {
    var title = _a.title, message = _a.message, onRetry = _a.onRetry, onGoBack = _a.onGoBack, hideBackButton = _a.hideBackButton, _b = _a.sideBorders, sideBorders = _b === void 0 ? true : _b;
    var _ = useLingui()._;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var goBack = useGoBack(onGoBack);
    return (_jsxs(CenteredView, { style: [
            a.h_full_vh,
            a.align_center,
            a.gap_5xl,
            !gtMobile && a.justify_between,
            t.atoms.border_contrast_low,
            { paddingTop: 175, paddingBottom: 110 },
        ], sideBorders: sideBorders, children: [_jsxs(View, { style: [a.w_full, a.align_center, a.gap_lg], children: [_jsx(Text, { style: [a.font_semi_bold, a.text_3xl], children: title }), _jsx(Text, { style: [
                            a.text_md,
                            a.text_center,
                            t.atoms.text_contrast_high,
                            { lineHeight: 1.4 },
                            gtMobile ? { width: 450 } : [a.w_full, a.px_lg],
                        ], children: message })] }), _jsxs(View, { style: [a.gap_md, gtMobile ? { width: 350 } : [a.w_full, a.px_lg]], children: [onRetry && (_jsx(Button, { variant: "solid", color: "primary", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Press to retry"], ["Press to retry"])))), onPress: onRetry, size: "large", style: [a.rounded_sm, a.overflow_hidden, { paddingVertical: 10 }], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) }) })), !hideBackButton && (_jsx(Button, { variant: "solid", color: onRetry ? 'secondary' : 'primary', label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Return to previous page"], ["Return to previous page"])))), onPress: goBack, size: "large", style: [a.rounded_sm, a.overflow_hidden, { paddingVertical: 10 }], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Go Back" }) }) }))] })] }));
}
var templateObject_1, templateObject_2;
