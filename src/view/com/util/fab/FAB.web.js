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
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { FABInner } from './FABInner';
export var FAB = function (_opts) {
    var isDesktop = useWebMediaQueries().isDesktop;
    if (!isDesktop) {
        return _jsx(FABInner, __assign({}, _opts));
    }
    return _jsx(View, {});
};
