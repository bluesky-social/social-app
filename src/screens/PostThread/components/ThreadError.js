var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useCleanError } from '#/lib/hooks/useCleanError';
import { OUTER_SPACE } from '#/screens/PostThread/const';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';
export function ThreadError(_a) {
    var error = _a.error, onRetry = _a.onRetry;
    var t = useTheme();
    var _ = useLingui()._;
    var cleanError = useCleanError();
    var _b = useMemo(function () {
        var title = _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Error loading post"], ["Error loading post"]))));
        var message = _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Something went wrong. Please try again in a moment."], ["Something went wrong. Please try again in a moment."]))));
        var _a = cleanError(error), raw = _a.raw, clean = _a.clean;
        if (error.message.startsWith('Post not found')) {
            title = _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Post not found"], ["Post not found"]))));
            message = clean || raw || message;
        }
        return { title: title, message: message };
    }, [_, error, cleanError]), title = _b.title, message = _b.message;
    return (_jsx(Layout.Center, { children: _jsx(View, { style: [
                a.w_full,
                a.align_center,
                {
                    padding: OUTER_SPACE,
                    paddingTop: OUTER_SPACE * 2,
                },
            ], children: _jsxs(View, { style: [
                    a.w_full,
                    a.align_center,
                    a.gap_xl,
                    {
                        maxWidth: 260,
                    },
                ], children: [_jsxs(View, { style: [a.gap_xs], children: [_jsx(Text, { style: [
                                    a.text_center,
                                    a.text_lg,
                                    a.font_semi_bold,
                                    a.leading_snug,
                                ], children: title }), _jsx(Text, { style: [
                                    a.text_center,
                                    a.text_sm,
                                    a.leading_snug,
                                    t.atoms.text_contrast_medium,
                                ], children: message })] }), _jsxs(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Retry"], ["Retry"])))), size: "small", variant: "solid", color: "secondary_inverted", onPress: onRetry, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) }), _jsx(ButtonIcon, { icon: RetryIcon, position: "right" })] })] }) }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
