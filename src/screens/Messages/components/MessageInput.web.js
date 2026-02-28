var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Pressable, View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { flushSync } from 'react-dom';
import TextareaAutosize from 'react-textarea-autosize';
import { countGraphemes } from 'unicode-segmenter/grapheme';
import { MAX_DM_GRAPHEME_LENGTH } from '#/lib/constants';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { useMessageDraft, useSaveMessageDraft, } from '#/state/messages/message-drafts';
import { textInputWebEmitter } from '#/view/com/composer/text-input/textInputWebEmitter';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, flatten, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { useSharedInputStyles } from '#/components/forms/TextField';
import { EmojiArc_Stroke2_Corner0_Rounded as EmojiSmile } from '#/components/icons/Emoji';
import { PaperPlane_Stroke2_Corner0_Rounded as PaperPlane } from '#/components/icons/PaperPlane';
import { IS_WEB_SAFARI, IS_WEB_TOUCH_DEVICE } from '#/env';
import { useExtractEmbedFromFacets } from './MessageInputEmbed';
export function MessageInput(_a) {
    var onSendMessage = _a.onSendMessage, hasEmbed = _a.hasEmbed, setEmbed = _a.setEmbed, children = _a.children, openEmojiPicker = _a.openEmojiPicker;
    var isMobile = useWebMediaQueries().isMobile;
    var _ = useLingui()._;
    var t = useTheme();
    var _b = useMessageDraft(), getDraft = _b.getDraft, clearDraft = _b.clearDraft;
    var _c = React.useState(getDraft), message = _c[0], setMessage = _c[1];
    var inputStyles = useSharedInputStyles();
    var isComposing = React.useRef(false);
    var _d = React.useState(false), isFocused = _d[0], setIsFocused = _d[1];
    var _e = React.useState(false), isHovered = _e[0], setIsHovered = _e[1];
    var _f = React.useState(38), textAreaHeight = _f[0], setTextAreaHeight = _f[1];
    var textAreaRef = React.useRef(null);
    var onSubmit = React.useCallback(function () {
        if (!hasEmbed && message.trim() === '') {
            return;
        }
        if (countGraphemes(message) > MAX_DM_GRAPHEME_LENGTH) {
            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Message is too long"], ["Message is too long"])))), 'xmark');
            return;
        }
        clearDraft();
        onSendMessage(message);
        setMessage('');
        setEmbed(undefined);
    }, [message, onSendMessage, _, clearDraft, hasEmbed, setEmbed]);
    var onKeyDown = React.useCallback(function (e) {
        // Don't submit the form when the Japanese or any other IME is composing
        if (isComposing.current)
            return;
        // see https://github.com/bluesky-social/social-app/issues/4178
        // see https://www.stum.de/2016/06/24/handling-ime-events-in-javascript/
        // see https://lists.w3.org/Archives/Public/www-dom/2010JulSep/att-0182/keyCode-spec.html
        //
        // On Safari, the final keydown event to dismiss the IME - which is the enter key - is also "Enter" below.
        // Obviously, this causes problems because the final dismissal should _not_ submit the text, but should just
        // stop the IME editing. This is the behavior of Chrome and Firefox, but not Safari.
        //
        // Keycode is deprecated, however the alternative seems to only be to compare the timestamp from the
        // onCompositionEnd event to the timestamp of the keydown event, which is not reliable. For example, this hack
        // uses that method: https://github.com/ProseMirror/prosemirror-view/pull/44. However, from my 500ms resulted in
        // far too long of a delay, and a subsequent enter press would often just end up doing nothing. A shorter time
        // frame was also not great, since it was too short to be reliable (i.e. an older system might have a larger
        // time gap between the two events firing.
        if (IS_WEB_SAFARI && e.key === 'Enter' && e.keyCode === 229) {
            return;
        }
        if (e.key === 'Enter') {
            if (e.shiftKey)
                return;
            e.preventDefault();
            onSubmit();
        }
    }, [onSubmit]);
    var onChange = React.useCallback(function (e) {
        setMessage(e.target.value);
    }, []);
    var onEmojiInserted = React.useCallback(function (emoji) {
        var _a;
        if (!textAreaRef.current) {
            return;
        }
        var position = (_a = textAreaRef.current.selectionStart) !== null && _a !== void 0 ? _a : 0;
        textAreaRef.current.focus();
        flushSync(function () {
            setMessage(function (message) {
                return message.slice(0, position) + emoji.native + message.slice(position);
            });
        });
        textAreaRef.current.selectionStart = position + emoji.native.length;
        textAreaRef.current.selectionEnd = position + emoji.native.length;
    }, [setMessage]);
    React.useEffect(function () {
        textInputWebEmitter.addListener('emoji-inserted', onEmojiInserted);
        return function () {
            textInputWebEmitter.removeListener('emoji-inserted', onEmojiInserted);
        };
    }, [onEmojiInserted]);
    useSaveMessageDraft(message);
    useExtractEmbedFromFacets(message, setEmbed);
    return (_jsxs(View, { style: a.p_sm, children: [children, _jsxs(View, { style: [
                    a.flex_row,
                    t.atoms.bg_contrast_25,
                    {
                        paddingRight: a.p_sm.padding - 2,
                        paddingLeft: a.p_sm.padding - 2,
                        borderWidth: 1,
                        borderRadius: 23,
                        borderColor: 'transparent',
                        height: textAreaHeight + 23,
                    },
                    isHovered && inputStyles.chromeHover,
                    isFocused && inputStyles.chromeFocus,
                ], 
                // @ts-expect-error web only
                onMouseEnter: function () { return setIsHovered(true); }, onMouseLeave: function () { return setIsHovered(false); }, children: [_jsx(Button, { onPress: function (e) {
                            e.currentTarget.measure(function (_fx, _fy, _width, _height, px, py) {
                                openEmojiPicker === null || openEmojiPicker === void 0 ? void 0 : openEmojiPicker({
                                    top: py,
                                    left: px,
                                    right: px,
                                    bottom: py,
                                    nextFocusRef: textAreaRef,
                                });
                            });
                        }, style: [
                            a.rounded_full,
                            a.overflow_hidden,
                            a.align_center,
                            a.justify_center,
                            {
                                marginTop: 5,
                                height: 30,
                                width: 30,
                            },
                        ], label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Open emoji picker"], ["Open emoji picker"])))), children: function (state) { return (_jsx(View, { style: [
                                a.absolute,
                                a.inset_0,
                                a.align_center,
                                a.justify_center,
                                {
                                    backgroundColor: state.hovered || state.focused || state.pressed
                                        ? t.atoms.bg.backgroundColor
                                        : undefined,
                                },
                            ], children: _jsx(EmojiSmile, { size: "lg" }) })); } }), _jsx(TextareaAutosize, { ref: textAreaRef, style: flatten([
                            a.flex_1,
                            a.px_sm,
                            a.border_0,
                            t.atoms.text,
                            {
                                paddingTop: 10,
                                backgroundColor: 'transparent',
                                resize: 'none',
                            },
                        ]), maxRows: 12, placeholder: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Write a message"], ["Write a message"])))), defaultValue: "", value: message, dirName: "ltr", autoFocus: true, onFocus: function () { return setIsFocused(true); }, onBlur: function () { return setIsFocused(false); }, onCompositionStart: function () {
                            isComposing.current = true;
                        }, onCompositionEnd: function () {
                            isComposing.current = false;
                        }, onHeightChange: function (height) { return setTextAreaHeight(height); }, onChange: onChange, 
                        // On mobile web phones, we want to keep the same behavior as the native app. Do not submit the message
                        // in these cases.
                        onKeyDown: IS_WEB_TOUCH_DEVICE && isMobile ? undefined : onKeyDown }), _jsx(Pressable, { accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Send message"], ["Send message"])))), accessibilityHint: "", style: [
                            a.rounded_full,
                            a.align_center,
                            a.justify_center,
                            {
                                height: 30,
                                width: 30,
                                marginTop: 5,
                                backgroundColor: t.palette.primary_500,
                            },
                        ], onPress: onSubmit, children: _jsx(PaperPlane, { fill: t.palette.white, style: [a.relative, { left: 1 }] }) })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
