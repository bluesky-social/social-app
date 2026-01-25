import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useTheme, } from '#/alf';
export function IconCircle(_a) {
    var Icon = _a.icon, _b = _a.size, size = _b === void 0 ? 'xl' : _b, style = _a.style, iconStyle = _a.iconStyle;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.justify_center,
            a.align_center,
            a.rounded_full,
            {
                width: size === 'lg' ? 52 : 64,
                height: size === 'lg' ? 52 : 64,
                backgroundColor: t.palette.primary_50,
            },
            style,
        ], children: _jsx(Icon, { size: size, style: [{ color: t.palette.primary_500 }, iconStyle] }) }));
}
