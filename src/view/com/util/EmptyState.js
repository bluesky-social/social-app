var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { usePalette } from '#/lib/hooks/usePalette';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { EditBig_Stroke1_Corner0_Rounded as EditIcon } from '#/components/icons/EditBig';
import { Text } from '#/components/Typography';
export function EmptyState(_a) {
    var testID = _a.testID, icon = _a.icon, _b = _a.iconSize, iconSize = _b === void 0 ? '3xl' : _b, message = _a.message, style = _a.style, textStyle = _a.textStyle, button = _a.button;
    var pal = usePalette('default');
    var isTabletOrDesktop = useWebMediaQueries().isTabletOrDesktop;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var placeholderIcon = (_jsx(EditIcon, { size: "2xl", fill: t.atoms.text_contrast_medium.color }));
    var renderIcon = function () {
        if (!icon) {
            return placeholderIcon;
        }
        if (React.isValidElement(icon)) {
            return icon;
        }
        if (typeof icon === 'function' ||
            (typeof icon === 'object' && icon && 'render' in icon)) {
            var IconComponent = icon;
            return (_jsx(IconComponent, { size: iconSize, fill: t.atoms.text_contrast_medium.color, style: { color: t.atoms.text_contrast_low.color } }));
        }
        return placeholderIcon;
    };
    return (_jsxs(View, { testID: testID, style: [a.w_full, style], children: [_jsx(View, { style: [
                    a.flex_row,
                    a.align_center,
                    a.justify_center,
                    a.self_center,
                    a.rounded_full,
                    a.mt_5xl,
                    { height: 64, width: 64 },
                    React.isValidElement(icon)
                        ? a.bg_transparent
                        : [isTabletOrDesktop && { marginTop: 50 }],
                ], children: renderIcon() }), _jsx(Text, { style: [
                    {
                        color: pal.colors.textLight,
                        maxWidth: gtMobile ? '40%' : '60%',
                    },
                    a.pt_xs,
                    a.font_medium,
                    a.text_md,
                    a.leading_snug,
                    a.text_center,
                    a.self_center,
                    !button && a.mb_5xl,
                    textStyle,
                ], children: message }), button && (_jsx(View, { style: [a.flex_shrink, a.mt_xl, a.self_center, a.mb_5xl], children: _jsx(Button, __assign({}, button, { children: _jsx(ButtonText, { children: button.text }) })) }))] }));
}
