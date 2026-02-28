var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import EmojiPicker from '@emoji-mart/react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { DropdownMenu } from 'radix-ui';
import { useSession } from '#/state/session';
import { useWebPreloadEmoji } from '#/view/com/composer/text-input/web/useWebPreloadEmoji';
import { atoms as a, flatten, useTheme } from '#/alf';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotGridIcon } from '#/components/icons/DotGrid';
import * as Menu from '#/components/Menu';
import { Text } from '#/components/Typography';
import { hasAlreadyReacted, hasReachedReactionLimit } from './util';
export function EmojiReactionPicker(_a) {
    var message = _a.message, children = _a.children, onEmojiSelect = _a.onEmojiSelect;
    if (!children)
        throw new Error('EmojiReactionPicker requires the children prop on web');
    var _ = useLingui()._;
    return (_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Add emoji reaction"], ["Add emoji reaction"])))), children: children }), _jsx(MenuInner, { message: message, onEmojiSelect: onEmojiSelect })] }));
}
function MenuInner(_a) {
    var message = _a.message, onEmojiSelect = _a.onEmojiSelect;
    var t = useTheme();
    var control = Menu.useMenuContext().control;
    var currentAccount = useSession().currentAccount;
    useWebPreloadEmoji({ immediate: true });
    var _b = useState(false), expanded = _b[0], setExpanded = _b[1];
    var _c = useState(control.isOpen), prevOpen = _c[0], setPrevOpen = _c[1];
    if (control.isOpen !== prevOpen) {
        setPrevOpen(control.isOpen);
        if (!control.isOpen) {
            setExpanded(false);
        }
    }
    var handleEmojiPickerResponse = function (emoji) {
        handleEmojiSelect(emoji.native);
    };
    var handleEmojiSelect = function (emoji) {
        control.close();
        onEmojiSelect(emoji);
    };
    var limitReacted = hasReachedReactionLimit(message, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    return expanded ? (_jsx(DropdownMenu.Portal, { children: _jsx(DropdownMenu.Content, { sideOffset: 5, collisionPadding: { left: 5, right: 5, bottom: 5 }, children: _jsx("div", { onWheel: function (evt) { return evt.stopPropagation(); }, children: _jsx(EmojiPicker, { onEmojiSelect: handleEmojiPickerResponse, autoFocus: true }) }) }) })) : (_jsx(Menu.Outer, { style: [a.rounded_full], children: _jsxs(View, { style: [a.flex_row, a.gap_xs], children: [['👍', '😆', '❤️', '👀', '😢'].map(function (emoji) {
                    var alreadyReacted = hasAlreadyReacted(message, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did, emoji);
                    return (_jsx(DropdownMenu.Item, { className: [
                            'EmojiReactionPicker__Pressable',
                            alreadyReacted && '__selected',
                            limitReacted && '__disabled',
                        ]
                            .filter(Boolean)
                            .join(' '), onSelect: function () { return handleEmojiSelect(emoji); }, style: flatten([
                            a.flex,
                            a.flex_col,
                            a.rounded_full,
                            a.justify_center,
                            a.align_center,
                            a.transition_transform,
                            {
                                width: 34,
                                height: 34,
                            },
                            alreadyReacted && {
                                backgroundColor: t.atoms.bg_contrast_100.backgroundColor,
                            },
                        ]), children: _jsx(Text, { style: [a.text_center, { fontSize: 28 }], emoji: true, children: emoji }) }, emoji));
                }), _jsx(DropdownMenu.Item, { asChild: true, className: "EmojiReactionPicker__PickerButton", children: _jsx(Pressable, { accessibilityRole: "button", role: "button", onPress: function () { return setExpanded(true); }, style: flatten([
                            a.rounded_full,
                            { height: 34, width: 34 },
                            a.justify_center,
                            a.align_center,
                        ]), children: _jsx(DotGridIcon, { size: "lg", style: t.atoms.text_contrast_medium }) }) })] }) }));
}
var templateObject_1;
