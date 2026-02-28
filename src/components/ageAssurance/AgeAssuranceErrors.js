var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import * as Admonition from '#/components/Admonition';
import { ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import { refetchConfig } from '#/ageAssurance/data';
export function AgeAssuranceConfigUnavailableError(props) {
    var _ = useLingui()._;
    return (_jsx(Admonition.Outer, { type: "error", style: props.style, children: _jsxs(Admonition.Row, { children: [_jsx(Admonition.Icon, {}), _jsx(Admonition.Content, { children: _jsx(Admonition.Text, { children: _jsx(Trans, { children: "We were unable to load the age assurance configuration for your region, probably due to a network error. Some content and features may be unavailable temporarily. Please try again later." }) }) }), _jsxs(Admonition.Button, { color: "negative_subtle", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Retry"], ["Retry"])))), onPress: function () { return refetchConfig().catch(function () { }); }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) }), _jsx(ButtonIcon, { icon: RetryIcon })] })] }) }));
}
var templateObject_1;
