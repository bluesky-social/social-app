var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useImperativeHandle } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useTheme } from '#/alf';
import { Portal } from '#/components/Portal';
import { IS_WEB } from '#/env';
import { AnimatedCheck } from '../anim/AnimatedCheck';
import { Text } from '../Typography';
export var ProgressGuideToast = React.forwardRef(function ProgressGuideToast(_a, ref) {
    var title = _a.title, subtitle = _a.subtitle, visibleDuration = _a.visibleDuration;
    var t = useTheme();
    var _ = useLingui()._;
    var insets = useSafeAreaInsets();
    var _b = React.useState(false), isOpen = _b[0], setIsOpen = _b[1];
    var translateY = useSharedValue(0);
    var opacity = useSharedValue(0);
    var animatedCheckRef = React.useRef(null);
    var timeoutRef = React.useRef(undefined);
    var winDim = useWindowDimensions();
    /**
     * Methods
     */
    var close = React.useCallback(function () {
        // clear the timeout, in case this was called imperatively
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }
        // animate the opacity then set isOpen to false when done
        var setIsntOpen = function () { return setIsOpen(false); };
        opacity.set(function () {
            return withTiming(0, {
                duration: 400,
                easing: Easing.out(Easing.cubic),
            }, function () { return runOnJS(setIsntOpen)(); });
        });
    }, [setIsOpen, opacity]);
    var open = React.useCallback(function () {
        // set isOpen=true to render
        setIsOpen(true);
        // animate the vertical translation, the opacity, and the checkmark
        var playCheckmark = function () { var _a; return (_a = animatedCheckRef.current) === null || _a === void 0 ? void 0 : _a.play(); };
        opacity.set(0);
        opacity.set(function () {
            return withTiming(1, {
                duration: 100,
                easing: Easing.out(Easing.cubic),
            }, function () { return runOnJS(playCheckmark)(); });
        });
        translateY.set(0);
        translateY.set(function () {
            return withTiming(insets.top + 10, {
                duration: 500,
                easing: Easing.out(Easing.cubic),
            });
        });
        // start the countdown timer to autoclose
        timeoutRef.current = setTimeout(close, visibleDuration || 5e3);
    }, [setIsOpen, translateY, opacity, insets, close, visibleDuration]);
    useImperativeHandle(ref, function () { return ({
        open: open,
        close: close,
    }); }, [open, close]);
    var containerStyle = React.useMemo(function () {
        var left = 10;
        var right = 10;
        if (IS_WEB && winDim.width > 400) {
            left = right = (winDim.width - 380) / 2;
        }
        return {
            position: IS_WEB ? 'fixed' : 'absolute',
            top: 0,
            left: left,
            right: right,
        };
    }, [winDim.width]);
    var animatedStyle = useAnimatedStyle(function () { return ({
        transform: [{ translateY: translateY.get() }],
        opacity: opacity.get(),
    }); });
    return (isOpen && (_jsx(Portal, { children: _jsx(Animated.View, { style: [
                // @ts-ignore position: fixed is web only
                containerStyle,
                animatedStyle,
            ], children: _jsxs(Pressable, { style: [
                    t.atoms.bg,
                    a.flex_row,
                    a.align_center,
                    a.gap_md,
                    a.border,
                    t.atoms.border_contrast_high,
                    a.rounded_md,
                    a.px_lg,
                    a.py_md,
                    a.shadow_sm,
                    {
                        shadowRadius: 8,
                        shadowOpacity: 0.1,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 8,
                    },
                ], onPress: close, accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Tap to dismiss"], ["Tap to dismiss"])))), accessibilityHint: "", children: [_jsx(AnimatedCheck, { fill: t.palette.primary_500, ref: animatedCheckRef }), _jsxs(View, { children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold], children: title }), subtitle && (_jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_medium], children: subtitle }))] })] }) }) })));
});
var templateObject_1;
