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
import { forwardRef } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
// If you explode these into functions, don't forget to forwardRef!
/**
 * Avoid using `FlatList_INTERNAL` and use `List` where possible.
 * The types are a bit wrong on `FlatList_INTERNAL`
 */
export var FlatList_INTERNAL = Animated.FlatList;
/**
 * @deprecated use `Layout` components
 */
export var ScrollView = Animated.ScrollView;
/**
 * @deprecated use `Layout` components
 */
export var CenteredView = forwardRef(function CenteredView(props, ref) {
    return _jsx(View, __assign({ ref: ref }, props));
});
