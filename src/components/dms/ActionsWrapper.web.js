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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useConvoActive } from '#/state/messages/convo';
import { useSession } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useTheme } from '#/alf';
import { MessageContextMenu } from '#/components/dms/MessageContextMenu';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontalIcon } from '#/components/icons/DotGrid';
import { EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmileIcon } from '#/components/icons/Emoji';
import { EmojiReactionPicker } from './EmojiReactionPicker';
import { hasReachedReactionLimit } from './util';
export function ActionsWrapper(_a) {
    var message = _a.message, isFromSelf = _a.isFromSelf, children = _a.children;
    var viewRef = useRef(null);
    var t = useTheme();
    var _ = useLingui()._;
    var convo = useConvoActive();
    var currentAccount = useSession().currentAccount;
    var _b = useState(false), showActions = _b[0], setShowActions = _b[1];
    var onMouseEnter = useCallback(function () {
        setShowActions(true);
    }, []);
    var onMouseLeave = useCallback(function () {
        setShowActions(false);
    }, []);
    // We need to handle the `onFocus` separately because we want to know if there is a related target (the element
    // that is losing focus). If there isn't that means the focus is coming from a dropdown that is now closed.
    var onFocus = useCallback(function (e) {
        if (e.nativeEvent.relatedTarget == null)
            return;
        setShowActions(true);
    }, []);
    var onEmojiSelect = useCallback(function (emoji) {
        var _a;
        if ((_a = message.reactions) === null || _a === void 0 ? void 0 : _a.find(function (reaction) {
            return reaction.value === emoji &&
                reaction.sender.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
        })) {
            convo
                .removeReaction(message.id, emoji)
                .catch(function () { return Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Failed to remove emoji reaction"], ["Failed to remove emoji reaction"]))))); });
        }
        else {
            if (hasReachedReactionLimit(message, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did))
                return;
            convo
                .addReaction(message.id, emoji)
                .catch(function () {
                return Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Failed to add emoji reaction"], ["Failed to add emoji reaction"])))), 'xmark');
            });
        }
    }, [_, convo, message, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did]);
    return (_jsxs(View, { onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave, 
        // @ts-expect-error web only
        onFocus: onFocus, onBlur: onMouseLeave, style: [a.flex_1, isFromSelf ? a.flex_row : a.flex_row_reverse], ref: viewRef, children: [_jsxs(View, { style: [
                    a.justify_center,
                    a.flex_row,
                    a.align_center,
                    isFromSelf
                        ? [a.mr_xs, { marginLeft: 'auto' }, a.flex_row_reverse]
                        : [a.ml_xs, { marginRight: 'auto' }],
                ], children: [_jsx(EmojiReactionPicker, { message: message, onEmojiSelect: onEmojiSelect, children: function (_a) {
                            var props = _a.props, state = _a.state, IS_NATIVE = _a.IS_NATIVE, control = _a.control;
                            // always false, file is platform split
                            if (IS_NATIVE)
                                return null;
                            var showMenuTrigger = showActions || control.isOpen ? 1 : 0;
                            return (_jsx(Pressable, __assign({}, props, { style: [
                                    { opacity: showMenuTrigger },
                                    a.p_xs,
                                    a.rounded_full,
                                    (state.hovered || state.pressed) && t.atoms.bg_contrast_25,
                                ], children: _jsx(EmojiSmileIcon, { size: "md", style: t.atoms.text_contrast_medium }) })));
                        } }), _jsx(MessageContextMenu, { message: message, children: function (_a) {
                            var props = _a.props, state = _a.state, IS_NATIVE = _a.IS_NATIVE, control = _a.control;
                            // always false, file is platform split
                            if (IS_NATIVE)
                                return null;
                            var showMenuTrigger = showActions || control.isOpen ? 1 : 0;
                            return (_jsx(Pressable, __assign({}, props, { style: [
                                    { opacity: showMenuTrigger },
                                    a.p_xs,
                                    a.rounded_full,
                                    (state.hovered || state.pressed) && t.atoms.bg_contrast_25,
                                ], children: _jsx(DotsHorizontalIcon, { size: "md", style: t.atoms.text_contrast_medium }) })));
                        } })] }), _jsx(View, { style: [{ maxWidth: '80%' }, isFromSelf ? a.align_end : a.align_start], children: children })] }));
}
var templateObject_1, templateObject_2;
