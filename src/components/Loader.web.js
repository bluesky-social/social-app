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
import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useTheme } from '#/alf';
import { useCommonSVGProps } from '#/components/icons/common';
import { Loader_Stroke2_Corner0_Rounded as Icon } from '#/components/icons/Loader';
export function Loader(props) {
    var t = useTheme();
    var common = useCommonSVGProps(props);
    return (_jsx(View, { style: [
            a.relative,
            a.justify_center,
            a.align_center,
            { width: common.size, height: common.size },
        ], children: _jsx("div", { className: "rotate-500ms", children: _jsx(Icon, __assign({}, props, { style: [
                    a.absolute,
                    a.inset_0,
                    t.atoms.text_contrast_high,
                    props.style,
                ] })) }) }));
}
