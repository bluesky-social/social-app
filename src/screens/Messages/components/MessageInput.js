var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { Pressable, TextInput, useWindowDimensions, View } from 'react-native';
import { useFocusedInputHandler, useReanimatedKeyboardAnimation, } from 'react-native-keyboard-controller';
import Animated, { measure, useAnimatedProps, useAnimatedRef, useAnimatedStyle, useSharedValue, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { countGraphemes } from 'unicode-segmenter/grapheme';
import { HITSLOP_10, MAX_DM_GRAPHEME_LENGTH } from '#/lib/constants';
import { useHaptics } from '#/lib/haptics';
import { useEmail } from '#/state/email-verification';
import { useMessageDraft, useSaveMessageDraft, } from '#/state/messages/message-drafts';
import * as Toast from '#/view/com/util/Toast';
import { android, atoms as a, useTheme } from '#/alf';
import { useSharedInputStyles } from '#/components/forms/TextField';
import { PaperPlane_Stroke2_Corner0_Rounded as PaperPlane } from '#/components/icons/PaperPlane';
import { IS_IOS, IS_WEB } from '#/env';
import { useExtractEmbedFromFacets } from './MessageInputEmbed';
var AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
export function MessageInput(_a) {
    var onSendMessage = _a.onSendMessage, hasEmbed = _a.hasEmbed, setEmbed = _a.setEmbed, children = _a.children;
    var _ = useLingui()._;
    var t = useTheme();
    var playHaptic = useHaptics();
    var _b = useMessageDraft(), getDraft = _b.getDraft, clearDraft = _b.clearDraft;
    // Input layout
    var topInset = useSafeAreaInsets().top;
    var windowHeight = useWindowDimensions().height;
    var keyboardHeight = useReanimatedKeyboardAnimation().height;
    var maxHeight = useSharedValue(undefined);
    var isInputScrollable = useSharedValue(false);
    var inputStyles = useSharedInputStyles();
    var _c = useState(false), isFocused = _c[0], setIsFocused = _c[1];
    var _d = useState(getDraft), message = _d[0], setMessage = _d[1];
    var inputRef = useAnimatedRef();
    var _e = useState(false), shouldEnforceClear = _e[0], setShouldEnforceClear = _e[1];
    var needsEmailVerification = useEmail().needsEmailVerification;
    useSaveMessageDraft(message);
    useExtractEmbedFromFacets(message, setEmbed);
    var onSubmit = useCallback(function () {
        if (needsEmailVerification) {
            return;
        }
        if (!hasEmbed && message.trim() === '') {
            return;
        }
        if (countGraphemes(message) > MAX_DM_GRAPHEME_LENGTH) {
            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Message is too long"], ["Message is too long"])))), 'xmark');
            return;
        }
        clearDraft();
        onSendMessage(message);
        playHaptic();
        setEmbed(undefined);
        setMessage('');
        if (IS_IOS) {
            setShouldEnforceClear(true);
        }
        if (IS_WEB) {
            // Pressing the send button causes the text input to lose focus, so we need to
            // re-focus it after sending
            setTimeout(function () {
                var _a;
                (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            }, 100);
        }
    }, [
        needsEmailVerification,
        hasEmbed,
        message,
        clearDraft,
        onSendMessage,
        playHaptic,
        setEmbed,
        inputRef,
        _,
    ]);
    useFocusedInputHandler({
        onChangeText: function () {
            'worklet';
            var measurement = measure(inputRef);
            if (!measurement)
                return;
            var max = windowHeight - -keyboardHeight.get() - topInset - 150;
            var availableSpace = max - measurement.height;
            maxHeight.set(max);
            isInputScrollable.set(availableSpace < 30);
        },
    }, [windowHeight, topInset]);
    var animatedStyle = useAnimatedStyle(function () { return ({
        maxHeight: maxHeight.get(),
    }); });
    var animatedProps = useAnimatedProps(function () { return ({
        scrollEnabled: isInputScrollable.get(),
    }); });
    return (_jsxs(View, { style: [a.px_md, a.pb_sm, a.pt_xs], children: [children, _jsxs(View, { style: [
                    a.w_full,
                    a.flex_row,
                    t.atoms.bg_contrast_25,
                    {
                        padding: a.p_sm.padding - 2,
                        paddingLeft: a.p_md.padding - 2,
                        borderWidth: 1,
                        borderRadius: 23,
                        borderColor: 'transparent',
                    },
                    isFocused && inputStyles.chromeFocus,
                ], children: [_jsx(AnimatedTextInput, { accessibilityLabel: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Message input field"], ["Message input field"])))), accessibilityHint: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Type your message here"], ["Type your message here"])))), placeholder: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Write a message"], ["Write a message"])))), placeholderTextColor: t.palette.contrast_500, value: message, onChange: function (evt) {
                            // bit of a hack: iOS automatically accepts autocomplete suggestions when you tap anywhere on the screen
                            // including the button we just pressed - and this overrides clearing the input! so we watch for the
                            // next change and double make sure the input is cleared. It should *always* send an onChange event after
                            // clearing via setMessage('') that happens in onSubmit()
                            // -sfn
                            if (IS_IOS && shouldEnforceClear) {
                                setShouldEnforceClear(false);
                                setMessage('');
                                return;
                            }
                            var text = evt.nativeEvent.text;
                            setMessage(text);
                        }, multiline: true, style: [
                            a.flex_1,
                            a.text_md,
                            a.px_sm,
                            t.atoms.text,
                            android({ paddingTop: 0 }),
                            { paddingBottom: IS_IOS ? 5 : 0 },
                            animatedStyle,
                        ], keyboardAppearance: t.scheme, submitBehavior: "newline", onFocus: function () { return setIsFocused(true); }, onBlur: function () { return setIsFocused(false); }, ref: inputRef, hitSlop: HITSLOP_10, animatedProps: animatedProps, editable: !needsEmailVerification }), _jsx(Pressable, { accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Send message"], ["Send message"])))), accessibilityHint: "", hitSlop: HITSLOP_10, style: [
                            a.rounded_full,
                            a.align_center,
                            a.justify_center,
                            { height: 30, width: 30, backgroundColor: t.palette.primary_500 },
                        ], onPress: onSubmit, disabled: needsEmailVerification, children: _jsx(PaperPlane, { fill: t.palette.white, style: [a.relative, { left: 1 }] }) })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
