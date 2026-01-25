import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useTheme } from '#/alf';
import { IS_NATIVE, IS_WEB, IS_WEB_TOUCH_DEVICE } from '#/env';
export function SubtleHover(_a) {
    var style = _a.style, hover = _a.hover, _b = _a.web, web = _b === void 0 ? true : _b, _c = _a.native, native = _c === void 0 ? false : _c;
    var t = useTheme();
    var opacity;
    switch (t.name) {
        case 'dark':
            opacity = 0.4;
            break;
        case 'dim':
            opacity = 0.45;
            break;
        case 'light':
            opacity = 0.5;
            break;
    }
    var el = (_jsx(View, { style: [
            a.absolute,
            a.inset_0,
            a.pointer_events_none,
            a.transition_opacity,
            t.atoms.bg_contrast_50,
            style,
            { opacity: hover ? opacity : 0 },
        ] }));
    if (IS_WEB && web) {
        return IS_WEB_TOUCH_DEVICE ? null : el;
    }
    else if (IS_NATIVE && native) {
        return el;
    }
    return null;
}
