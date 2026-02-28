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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { StyleSheet, } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '#/lib/custom-animations/PressableScale';
import { useHaptics } from '#/lib/haptics';
import { useMinimalShellFabTransform } from '#/lib/hooks/useMinimalShellTransform';
import { clamp } from '#/lib/numbers';
import { atoms as a, ios, useBreakpoints, useTheme } from '#/alf';
import { IS_WEB } from '#/env';
export function FABInner(_a) {
    var testID = _a.testID, icon = _a.icon, onPress = _a.onPress, style = _a.style, props = __rest(_a, ["testID", "icon", "onPress", "style"]);
    var insets = useSafeAreaInsets();
    var gtMobile = useBreakpoints().gtMobile;
    var t = useTheme();
    var playHaptic = useHaptics();
    var fabMinimalShellTransform = useMinimalShellFabTransform();
    var size = gtMobile ? styles.sizeLarge : styles.sizeRegular;
    var tabletSpacing = gtMobile
        ? { right: 50, bottom: 50 }
        : { right: 24, bottom: clamp(insets.bottom, 15, 60) + 15 };
    return (_jsx(Animated.View, { style: [
            styles.outer,
            size,
            tabletSpacing,
            !gtMobile && fabMinimalShellTransform,
        ], children: _jsx(PressableScale, __assign({ testID: testID, onPressIn: ios(function () { return playHaptic('Light'); }), onPress: function (evt) {
                onPress === null || onPress === void 0 ? void 0 : onPress(evt);
                playHaptic('Light');
            }, onLongPress: ios(function (evt) {
                onPress === null || onPress === void 0 ? void 0 : onPress(evt);
                playHaptic('Heavy');
            }), targetScale: 0.9, style: [
                a.rounded_full,
                size,
                { backgroundColor: t.palette.primary_500 },
                a.align_center,
                a.justify_center,
                style,
            ] }, props, { children: icon })) }));
}
var styles = StyleSheet.create({
    sizeRegular: {
        width: 56,
        height: 56,
        borderRadius: 30,
    },
    sizeLarge: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    outer: {
        // @ts-ignore web-only
        position: IS_WEB ? 'fixed' : 'absolute',
        zIndex: 1,
        cursor: 'pointer',
    },
});
