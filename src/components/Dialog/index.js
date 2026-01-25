var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useImperativeHandle } from 'react';
import { Pressable, TextInput, View, } from 'react-native';
import { KeyboardAwareScrollView, useKeyboardHandler, useReanimatedKeyboardAnimation, } from 'react-native-keyboard-controller';
import Animated, { runOnJS, useAnimatedStyle, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useEnableKeyboardController } from '#/lib/hooks/useEnableKeyboardController';
import { ScrollProvider } from '#/lib/ScrollContext';
import { logger } from '#/logger';
import { useA11y } from '#/state/a11y';
import { useDialogStateControlContext } from '#/state/dialogs';
import { List } from '#/view/com/util/List';
import { atoms as a, ios, platform, tokens, useTheme } from '#/alf';
import { useThemeName } from '#/alf/util/useColorModeTheme';
import { Context, useDialogContext } from '#/components/Dialog/context';
import { createInput } from '#/components/forms/TextField';
import { IS_ANDROID, IS_IOS } from '#/env';
import { BottomSheet, BottomSheetSnapPoint } from '../../../modules/bottom-sheet';
export { useDialogContext, useDialogControl } from '#/components/Dialog/context';
export * from '#/components/Dialog/shared';
export * from '#/components/Dialog/types';
export * from '#/components/Dialog/utils';
export var Input = createInput(TextInput);
export function Outer(_a) {
    var children = _a.children, control = _a.control, onClose = _a.onClose, nativeOptions = _a.nativeOptions, testID = _a.testID;
    var themeName = useThemeName();
    var t = useTheme(themeName);
    var ref = React.useRef(null);
    var closeCallbacks = React.useRef([]);
    var _b = useDialogStateControlContext(), setDialogIsOpen = _b.setDialogIsOpen, setFullyExpandedCount = _b.setFullyExpandedCount;
    var prevSnapPoint = React.useRef(BottomSheetSnapPoint.Hidden);
    var _c = React.useState(false), disableDrag = _c[0], setDisableDrag = _c[1];
    var _d = React.useState(BottomSheetSnapPoint.Partial), snapPoint = _d[0], setSnapPoint = _d[1];
    var callQueuedCallbacks = React.useCallback(function () {
        for (var _i = 0, _a = closeCallbacks.current; _i < _a.length; _i++) {
            var cb = _a[_i];
            try {
                cb();
            }
            catch (e) {
                logger.error(e || 'Error running close callback');
            }
        }
        closeCallbacks.current = [];
    }, []);
    var open = React.useCallback(function () {
        var _a;
        // Run any leftover callbacks that might have been queued up before calling `.open()`
        callQueuedCallbacks();
        setDialogIsOpen(control.id, true);
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.present();
    }, [setDialogIsOpen, control.id, callQueuedCallbacks]);
    // This is the function that we call when we want to dismiss the dialog.
    var close = React.useCallback(function (cb) {
        var _a;
        if (typeof cb === 'function') {
            closeCallbacks.current.push(cb);
        }
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.dismiss();
    }, []);
    // This is the actual thing we are doing once we "confirm" the dialog. We want the dialog's close animation to
    // happen before we run this. It is passed to the `BottomSheet` component.
    var onCloseAnimationComplete = React.useCallback(function () {
        // This removes the dialog from our list of stored dialogs. Not super necessary on iOS, but on Android this
        // tells us that we need to toggle the accessibility overlay setting
        setDialogIsOpen(control.id, false);
        callQueuedCallbacks();
        onClose === null || onClose === void 0 ? void 0 : onClose();
    }, [callQueuedCallbacks, control.id, onClose, setDialogIsOpen]);
    var onSnapPointChange = function (e) {
        var snapPoint = e.nativeEvent.snapPoint;
        setSnapPoint(snapPoint);
        if (snapPoint === BottomSheetSnapPoint.Full &&
            prevSnapPoint.current !== BottomSheetSnapPoint.Full) {
            setFullyExpandedCount(function (c) { return c + 1; });
        }
        else if (snapPoint !== BottomSheetSnapPoint.Full &&
            prevSnapPoint.current === BottomSheetSnapPoint.Full) {
            setFullyExpandedCount(function (c) { return c - 1; });
        }
        prevSnapPoint.current = snapPoint;
    };
    var onStateChange = function (e) {
        if (e.nativeEvent.state === 'closed') {
            onCloseAnimationComplete();
            if (prevSnapPoint.current === BottomSheetSnapPoint.Full) {
                setFullyExpandedCount(function (c) { return c - 1; });
            }
            prevSnapPoint.current = BottomSheetSnapPoint.Hidden;
        }
    };
    useImperativeHandle(control.ref, function () { return ({
        open: open,
        close: close,
    }); }, [open, close]);
    var context = React.useMemo(function () { return ({
        close: close,
        IS_NATIVEDialog: true,
        nativeSnapPoint: snapPoint,
        disableDrag: disableDrag,
        setDisableDrag: setDisableDrag,
        isWithinDialog: true,
    }); }, [close, snapPoint, disableDrag, setDisableDrag]);
    return (_jsx(BottomSheet, __assign({ ref: ref, cornerRadius: 20, backgroundColor: t.atoms.bg.backgroundColor }, nativeOptions, { onSnapPointChange: onSnapPointChange, onStateChange: onStateChange, disableDrag: disableDrag, children: _jsx(Context.Provider, { value: context, children: _jsx(View, { testID: testID, style: [a.relative], children: children }) }) })));
}
export function Inner(_a) {
    var children = _a.children, style = _a.style, header = _a.header;
    var insets = useSafeAreaInsets();
    return (_jsxs(_Fragment, { children: [header, _jsx(View, { style: [
                    a.pt_2xl,
                    a.px_xl,
                    {
                        paddingBottom: insets.bottom + insets.top,
                    },
                    style,
                ], children: children })] }));
}
export var ScrollableInner = React.forwardRef(function ScrollableInner(_a, ref) {
    var children = _a.children, contentContainerStyle = _a.contentContainerStyle, header = _a.header, props = __rest(_a, ["children", "contentContainerStyle", "header"]);
    var _b = useDialogContext(), nativeSnapPoint = _b.nativeSnapPoint, disableDrag = _b.disableDrag, setDisableDrag = _b.setDisableDrag;
    var insets = useSafeAreaInsets();
    useEnableKeyboardController(IS_IOS);
    var _c = React.useState(0), keyboardHeight = _c[0], setKeyboardHeight = _c[1];
    useKeyboardHandler({
        onEnd: function (e) {
            'worklet';
            runOnJS(setKeyboardHeight)(e.height);
        },
    }, []);
    var paddingBottom = 0;
    if (IS_IOS) {
        paddingBottom += keyboardHeight / 4;
        if (nativeSnapPoint === BottomSheetSnapPoint.Full) {
            paddingBottom += insets.bottom + tokens.space.md;
        }
        paddingBottom = Math.max(paddingBottom, tokens.space._2xl);
    }
    else {
        paddingBottom += keyboardHeight;
        if (nativeSnapPoint === BottomSheetSnapPoint.Full) {
            paddingBottom += insets.top;
        }
        paddingBottom +=
            Math.max(insets.bottom, tokens.space._5xl) + tokens.space._2xl;
    }
    var onScroll = function (e) {
        if (!IS_ANDROID) {
            return;
        }
        var contentOffset = e.nativeEvent.contentOffset;
        if (contentOffset.y > 0 && !disableDrag) {
            setDisableDrag(true);
        }
        else if (contentOffset.y <= 1 && disableDrag) {
            setDisableDrag(false);
        }
    };
    return (_jsxs(KeyboardAwareScrollView, __assign({ contentContainerStyle: [
            a.pt_2xl,
            a.px_xl,
            { paddingBottom: paddingBottom },
            contentContainerStyle,
        ], ref: ref, showsVerticalScrollIndicator: IS_ANDROID ? false : undefined }, props, { bounces: nativeSnapPoint === BottomSheetSnapPoint.Full, bottomOffset: 30, scrollEventThrottle: 50, onScroll: IS_ANDROID ? onScroll : undefined, keyboardShouldPersistTaps: "handled", 
        // TODO: figure out why this positions the header absolutely (rather than stickily)
        // on Android. fine to disable for now, because we don't have any
        // dialogs that use this that actually scroll -sfn
        stickyHeaderIndices: ios(header ? [0] : undefined), children: [header, children] })));
});
export var InnerFlatList = React.forwardRef(function InnerFlatList(_a, ref) {
    var footer = _a.footer, style = _a.style, props = __rest(_a, ["footer", "style"]);
    var insets = useSafeAreaInsets();
    var _b = useDialogContext(), nativeSnapPoint = _b.nativeSnapPoint, disableDrag = _b.disableDrag, setDisableDrag = _b.setDisableDrag;
    useEnableKeyboardController(IS_IOS);
    var onScroll = function (e) {
        'worklet';
        if (!IS_ANDROID) {
            return;
        }
        var contentOffset = e.contentOffset;
        if (contentOffset.y > 0 && !disableDrag) {
            runOnJS(setDisableDrag)(true);
        }
        else if (contentOffset.y <= 1 && disableDrag) {
            runOnJS(setDisableDrag)(false);
        }
    };
    return (_jsxs(ScrollProvider, { onScroll: onScroll, children: [_jsx(List, __assign({ keyboardShouldPersistTaps: "handled", bounces: nativeSnapPoint === BottomSheetSnapPoint.Full, ListFooterComponent: _jsx(View, { style: { height: insets.bottom + 100 } }), ref: ref, showsVerticalScrollIndicator: IS_ANDROID ? false : undefined }, props, { style: [a.h_full, style] })), footer] }));
});
export function FlatListFooter(_a) {
    var children = _a.children;
    var t = useTheme();
    var _b = useSafeAreaInsets(), top = _b.top, bottom = _b.bottom;
    var height = useReanimatedKeyboardAnimation().height;
    var animatedStyle = useAnimatedStyle(function () {
        if (!IS_IOS)
            return {};
        return {
            transform: [{ translateY: Math.min(0, height.get() + bottom - 10) }],
        };
    });
    return (_jsx(Animated.View, { style: [
            a.absolute,
            a.bottom_0,
            a.w_full,
            a.z_10,
            a.border_t,
            t.atoms.bg,
            t.atoms.border_contrast_low,
            a.px_lg,
            a.pt_md,
            {
                paddingBottom: platform({
                    ios: tokens.space.md + bottom,
                    android: tokens.space.md + bottom + top,
                }),
            },
            // TODO: had to admit defeat here, but we should
            // try and get this to work for Android as well -sfn
            ios(animatedStyle),
        ], children: children }));
}
export function Handle(_a) {
    var _b = _a.difference, difference = _b === void 0 ? false : _b, fill = _a.fill;
    var t = useTheme();
    var _ = useLingui()._;
    var screenReaderEnabled = useA11y().screenReaderEnabled;
    var close = useDialogContext().close;
    return (_jsx(View, { style: [a.absolute, a.w_full, a.align_center, a.z_10, { height: 20 }], children: _jsx(Pressable, { accessible: screenReaderEnabled, onPress: function () { return close(); }, accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Dismiss"], ["Dismiss"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Double tap to close the dialog"], ["Double tap to close the dialog"])))), children: _jsx(View, { style: [
                    a.rounded_sm,
                    {
                        top: tokens.space._2xl / 2 - 2.5,
                        width: 35,
                        height: 5,
                        alignSelf: 'center',
                    },
                    difference
                        ? {
                            // TODO: mixBlendMode is only available on the new architecture -sfn
                            // backgroundColor: t.palette.white,
                            // mixBlendMode: 'difference',
                            backgroundColor: t.palette.white,
                            opacity: 0.75,
                        }
                        : {
                            backgroundColor: fill || t.palette.contrast_975,
                            opacity: 0.5,
                        },
                ] }) }) }));
}
export function Close() {
    return null;
}
var templateObject_1, templateObject_2;
