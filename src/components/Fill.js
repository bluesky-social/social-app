import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a } from '#/alf';
export function Fill(_a) {
    var children = _a.children, style = _a.style;
    return _jsx(View, { style: [a.absolute, a.inset_0, style], children: children });
}
