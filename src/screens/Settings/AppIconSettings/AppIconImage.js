import { jsx as _jsx } from "react/jsx-runtime";
import { Image } from 'expo-image';
import { atoms as a, platform, useTheme } from '#/alf';
export function AppIconImage(_a) {
    var icon = _a.icon, _b = _a.size, size = _b === void 0 ? 50 : _b;
    var t = useTheme();
    return (_jsx(Image, { source: platform({
            ios: icon.iosImage(),
            android: icon.androidImage(),
        }), style: [
            { width: size, height: size },
            platform({
                ios: { borderRadius: size / 5 },
                android: a.rounded_full,
            }),
            a.curve_continuous,
            t.atoms.border_contrast_medium,
            a.border,
        ], accessibilityIgnoresInvertColors: true }));
}
