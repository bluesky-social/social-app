var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
export function ExternalEmbedRemoveBtn(_a) {
    var onRemove = _a.onRemove, style = _a.style;
    var t = useTheme();
    var _ = useLingui()._;
    return (_jsx(View, { style: [a.absolute, { top: 8, right: 8 }, a.z_50, style], children: _jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Remove attachment"], ["Remove attachment"])))), onPress: onRemove, size: "small", variant: "solid", color: "secondary", shape: "round", style: [t.atoms.shadow_sm], children: _jsx(ButtonIcon, { icon: X, size: "sm" }) }) }));
}
var templateObject_1;
