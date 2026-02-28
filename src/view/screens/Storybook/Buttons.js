import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from 'react';
import { View } from 'react-native';
import { atoms as a } from '#/alf';
import { Button, ButtonIcon, ButtonText, StackedButton, } from '#/components/Button';
import { ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft } from '#/components/icons/Chevron';
import { Globe_Stroke2_Corner0_Rounded as Globe } from '#/components/icons/Globe';
import { Text } from '#/components/Typography';
export function Buttons() {
    return (_jsxs(View, { style: [a.gap_md], children: [_jsx(Text, { style: [a.font_bold, a.text_5xl], children: "Buttons" }), _jsxs(View, { style: [a.flex_row, a.gap_md, a.align_start, { maxWidth: 350 }], children: [_jsx(StackedButton, { label: "stacked", icon: Globe, color: "secondary", style: [a.flex_1], children: "Bop it" }), _jsx(StackedButton, { label: "stacked", icon: Globe, color: "negative_subtle", style: [a.flex_1], children: "Twist it" }), _jsx(StackedButton, { label: "stacked", icon: Globe, color: "primary", style: [a.flex_1], children: "Pull it" })] }), [
                'primary',
                'secondary',
                'secondary_inverted',
                'negative',
                'primary_subtle',
                'negative_subtle',
            ].map(function (color) { return (_jsx(Fragment, { children: ['tiny', 'small', 'large'].map(function (size) { return (_jsxs(Fragment, { children: [_jsxs(Text, { style: [a.font_bold, a.text_2xl], children: ["color=", color, " size=", size] }), _jsxs(View, { style: [a.flex_row, a.align_start, a.gap_md], children: [_jsx(Button, { color: color, size: size, label: "Click here", children: _jsx(ButtonText, { children: "Button" }) }), _jsx(Button, { disabled: true, color: color, size: size, label: "Click here", children: _jsx(ButtonText, { children: "Button" }) }), _jsx(Button, { color: color, size: size, shape: "round", label: "Click here", children: _jsx(ButtonIcon, { icon: ChevronLeft }) }), _jsx(Button, { color: color, size: size, shape: "square", label: "Click here", children: _jsx(ButtonIcon, { icon: ChevronLeft }) })] }), _jsxs(View, { style: [a.flex_row, a.gap_md], children: [_jsxs(Button, { color: color, size: size, label: "Click here", children: [_jsx(ButtonIcon, { icon: Globe, position: "left" }), _jsx(ButtonText, { children: "Button" })] }), _jsxs(Button, { disabled: true, color: color, size: size, label: "Click here", children: [_jsx(ButtonText, { children: "Button" }), _jsx(ButtonIcon, { icon: Globe, position: "right" })] })] })] }, size)); }) }, color)); })] }));
}
