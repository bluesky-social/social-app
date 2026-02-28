var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { atoms as a } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Loader } from '#/components/Loader';
export function BackNextButtons(_a) {
    var hideNext = _a.hideNext, showRetry = _a.showRetry, isLoading = _a.isLoading, isNextDisabled = _a.isNextDisabled, onBackPress = _a.onBackPress, onNextPress = _a.onNextPress, onRetryPress = _a.onRetryPress, overrideNextText = _a.overrideNextText;
    var _ = useLingui()._;
    return (_jsxs(View, { style: [a.flex_row, a.justify_between, a.pb_lg, a.pt_3xl], children: [_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Go back to previous step"], ["Go back to previous step"])))), variant: "solid", color: "secondary", size: "large", onPress: onBackPress, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Back" }) }) }), !hideNext &&
                (showRetry ? (_jsxs(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Press to retry"], ["Press to retry"])))), variant: "solid", color: "primary", size: "large", onPress: onRetryPress, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) }), isLoading && _jsx(ButtonIcon, { icon: Loader })] })) : (_jsxs(Button, { testID: "nextBtn", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Continue to next step"], ["Continue to next step"])))), variant: "solid", color: "primary", size: "large", disabled: isLoading || isNextDisabled, onPress: onNextPress, children: [_jsx(ButtonText, { children: overrideNextText ? overrideNextText : _jsx(Trans, { children: "Next" }) }), isLoading && _jsx(ButtonIcon, { icon: Loader })] })))] }));
}
var templateObject_1, templateObject_2, templateObject_3;
