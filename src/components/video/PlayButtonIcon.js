import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useTheme } from '#/alf';
import { Play_Filled_Corner0_Rounded as PlayIcon } from '#/components/icons/Play';
export function PlayButtonIcon(_a) {
    var _b = _a.size, size = _b === void 0 ? 32 : _b;
    var t = useTheme();
    var bg = t.name === 'light' ? t.palette.contrast_25 : t.palette.contrast_975;
    var fg = t.name === 'light' ? t.palette.contrast_975 : t.palette.contrast_25;
    return (_jsxs(_Fragment, { children: [_jsx(View, { style: [
                    a.rounded_full,
                    {
                        backgroundColor: bg,
                        shadowColor: 'black',
                        shadowRadius: 32,
                        shadowOpacity: 0.5,
                        elevation: 24,
                        width: size + size / 1.5,
                        height: size + size / 1.5,
                        opacity: 0.7,
                    },
                ] }), _jsx(PlayIcon, { width: size, fill: fg, style: a.absolute })] }));
}
