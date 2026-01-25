var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming, } from 'react-native-reanimated';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { ScaleAndFadeIn } from '#/lib/custom-animations/ScaleAndFade';
import { ShrinkAndPop } from '#/lib/custom-animations/ShrinkAndPop';
import { useHaptics } from '#/lib/haptics';
import { atoms as a, useTheme } from '#/alf';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
var AnimatedPressable = Animated.createAnimatedComponent(Pressable);
var lastIndex = 0;
export function ChatEmptyPill() {
    var t = useTheme();
    var _ = useLingui()._;
    var playHaptic = useHaptics();
    var _a = React.useState(lastIndex), promptIndex = _a[0], setPromptIndex = _a[1];
    var scale = useSharedValue(1);
    var prompts = React.useMemo(function () {
        return [
            _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Say hello!"], ["Say hello!"])))),
            _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Share your favorite feed!"], ["Share your favorite feed!"])))),
            _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Tell a joke!"], ["Tell a joke!"])))),
            _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Share a fun fact!"], ["Share a fun fact!"])))),
            _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Share a cool story!"], ["Share a cool story!"])))),
            _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Send a neat website!"], ["Send a neat website!"])))),
            _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Clip \uD83D\uDC34 clop \uD83D\uDC34"], ["Clip \uD83D\uDC34 clop \uD83D\uDC34"])))),
        ];
    }, [_]);
    var onPressIn = React.useCallback(function () {
        if (IS_WEB)
            return;
        scale.set(function () { return withTiming(1.075, { duration: 100 }); });
    }, [scale]);
    var onPressOut = React.useCallback(function () {
        if (IS_WEB)
            return;
        scale.set(function () { return withTiming(1, { duration: 100 }); });
    }, [scale]);
    var onPress = React.useCallback(function () {
        runOnJS(playHaptic)();
        var randomPromptIndex = Math.floor(Math.random() * prompts.length);
        while (randomPromptIndex === lastIndex) {
            randomPromptIndex = Math.floor(Math.random() * prompts.length);
        }
        setPromptIndex(randomPromptIndex);
        lastIndex = randomPromptIndex;
    }, [playHaptic, prompts.length]);
    var animatedStyle = useAnimatedStyle(function () { return ({
        transform: [{ scale: scale.get() }],
    }); });
    return (_jsx(View, { style: [
            a.absolute,
            a.w_full,
            a.z_10,
            a.align_center,
            {
                top: -50,
            },
        ], children: _jsx(AnimatedPressable, { style: [
                a.px_xl,
                a.py_md,
                a.rounded_full,
                t.atoms.bg_contrast_25,
                a.align_center,
                animatedStyle,
            ], entering: ScaleAndFadeIn, exiting: ShrinkAndPop, onPress: onPress, onPressIn: onPressIn, onPressOut: onPressOut, children: _jsx(Text, { style: [a.font_semi_bold, a.pointer_events_none], selectable: false, children: prompts[promptIndex] }) }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
