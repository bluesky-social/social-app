import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { atoms as a, useTheme } from '#/alf';
export function AvatarCreatorCircle(_a) {
    var avatar = _a.avatar, _b = _a.size, size = _b === void 0 ? 125 : _b;
    var t = useTheme();
    var Icon = avatar.placeholder.component;
    var styles = React.useMemo(function () { return ({
        imageContainer: [
            a.rounded_full,
            a.overflow_hidden,
            a.align_center,
            a.justify_center,
            a.border,
            t.atoms.border_contrast_high,
            {
                height: size,
                width: size,
                backgroundColor: avatar.backgroundColor,
            },
        ],
    }); }, [avatar.backgroundColor, size, t.atoms.border_contrast_high]);
    return (_jsx(View, { children: _jsx(View, { style: styles.imageContainer, children: _jsx(Icon, { height: 85, width: 85, style: { color: t.palette.white } }) }) }));
}
