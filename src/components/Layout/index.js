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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, memo, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView, } from 'react-native-keyboard-controller';
import Animated, { useAnimatedProps, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShellLayout } from '#/state/shell/shell-layout';
import { atoms as a, useBreakpoints, useLayoutBreakpoints, useTheme, web, } from '#/alf';
import { useDialogContext } from '#/components/Dialog';
import { CENTER_COLUMN_OFFSET, SCROLLBAR_OFFSET } from '#/components/Layout/const';
import { ScrollbarOffsetContext } from '#/components/Layout/context';
import { IS_WEB } from '#/env';
export * from '#/components/Layout/const';
export * as Header from '#/components/Layout/Header';
/**
 * Outermost component of every screen
 */
export var Screen = memo(function Screen(_a) {
    var style = _a.style, noInsetTop = _a.noInsetTop, props = __rest(_a, ["style", "noInsetTop"]);
    var top = useSafeAreaInsets().top;
    return (_jsxs(_Fragment, { children: [IS_WEB && _jsx(WebCenterBorders, {}), _jsx(View, __assign({ style: [a.util_screen_outer, { paddingTop: noInsetTop ? 0 : top }, style] }, props))] }));
});
/**
 * Default scroll view for simple pages
 */
export var Content = memo(forwardRef(function Content(_a, ref) {
    var children = _a.children, style = _a.style, contentContainerStyle = _a.contentContainerStyle, ignoreTabletLayoutOffset = _a.ignoreTabletLayoutOffset, props = __rest(_a, ["children", "style", "contentContainerStyle", "ignoreTabletLayoutOffset"]);
    var t = useTheme();
    var footerHeight = useShellLayout().footerHeight;
    var animatedProps = useAnimatedProps(function () {
        return {
            scrollIndicatorInsets: {
                bottom: footerHeight.get(),
                top: 0,
                right: 1,
            },
        };
    });
    return (_jsx(Animated.ScrollView, __assign({ ref: ref, id: "content", automaticallyAdjustsScrollIndicatorInsets: false, indicatorStyle: t.scheme === 'dark' ? 'white' : 'black', 
        // sets the scroll inset to the height of the footer
        animatedProps: animatedProps, style: [scrollViewStyles.common, style], contentContainerStyle: [
            scrollViewStyles.contentContainer,
            contentContainerStyle,
        ] }, props, { children: IS_WEB ? (_jsx(Center, { ignoreTabletLayoutOffset: ignoreTabletLayoutOffset, children: children })) : (children) })));
}));
var scrollViewStyles = StyleSheet.create({
    common: {
        width: '100%',
    },
    contentContainer: {
        paddingBottom: 100,
    },
});
/**
 * Default scroll view for simple pages.
 *
 * BE SURE TO TEST THIS WHEN USING, it's untested as of writing this comment.
 */
export var KeyboardAwareContent = memo(function LayoutKeyboardAwareContent(_a) {
    var children = _a.children, style = _a.style, contentContainerStyle = _a.contentContainerStyle, props = __rest(_a, ["children", "style", "contentContainerStyle"]);
    return (_jsx(KeyboardAwareScrollView, __assign({ style: [scrollViewStyles.common, style], contentContainerStyle: [
            scrollViewStyles.contentContainer,
            contentContainerStyle,
        ], keyboardShouldPersistTaps: "handled" }, props, { children: IS_WEB ? _jsx(Center, { children: children }) : children })));
});
/**
 * Utility component to center content within the screen
 */
export var Center = memo(function LayoutCenter(_a) {
    var _b;
    var children = _a.children, style = _a.style, ignoreTabletLayoutOffset = _a.ignoreTabletLayoutOffset, props = __rest(_a, ["children", "style", "ignoreTabletLayoutOffset"]);
    var isWithinOffsetView = useContext(ScrollbarOffsetContext).isWithinOffsetView;
    var gtMobile = useBreakpoints().gtMobile;
    var centerColumnOffset = useLayoutBreakpoints().centerColumnOffset;
    var isWithinDialog = useDialogContext().isWithinDialog;
    var ctx = useMemo(function () { return ({ isWithinOffsetView: true }); }, []);
    return (_jsx(View, __assign({ style: [
            a.w_full,
            a.mx_auto,
            gtMobile && {
                maxWidth: 600,
            },
            !isWithinOffsetView && {
                transform: [
                    {
                        translateX: centerColumnOffset &&
                            !ignoreTabletLayoutOffset &&
                            !isWithinDialog
                            ? CENTER_COLUMN_OFFSET
                            : 0,
                    },
                    { translateX: (_b = web(SCROLLBAR_OFFSET)) !== null && _b !== void 0 ? _b : 0 },
                ],
            },
            style,
        ] }, props, { children: _jsx(ScrollbarOffsetContext.Provider, { value: ctx, children: children }) })));
});
/**
 * Only used within `Layout.Screen`, not for reuse
 */
var WebCenterBorders = memo(function LayoutWebCenterBorders() {
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var centerColumnOffset = useLayoutBreakpoints().centerColumnOffset;
    return gtMobile ? (_jsx(View, { style: [
            a.fixed,
            a.inset_0,
            a.border_l,
            a.border_r,
            t.atoms.border_contrast_low,
            web({
                width: 602,
                left: '50%',
                transform: __spreadArray([
                    { translateX: '-50%' },
                    { translateX: centerColumnOffset ? CENTER_COLUMN_OFFSET : 0 }
                ], a.scrollbar_offset.transform, true),
            }),
        ] })) : null;
});
