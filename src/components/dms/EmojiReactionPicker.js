var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useSession } from '#/state/session';
import { atoms as a, tokens, useTheme } from '#/alf';
import * as ContextMenu from '#/components/ContextMenu';
import { useContextMenuContext, useContextMenuMenuContext, } from '#/components/ContextMenu/context';
import { EmojiHeartEyes_Stroke2_Corner0_Rounded as EmojiHeartEyesIcon, EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmileIcon, } from '#/components/icons/Emoji';
import { Text } from '#/components/Typography';
import { EmojiPopup } from './EmojiPopup';
import { hasAlreadyReacted, hasReachedReactionLimit } from './util';
export function EmojiReactionPicker(_a) {
    var _b;
    var message = _a.message, onEmojiSelect = _a.onEmojiSelect;
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var t = useTheme();
    var isFromSelf = ((_b = message.sender) === null || _b === void 0 ? void 0 : _b.did) === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var _c = useContextMenuContext(), measurement = _c.measurement, close = _c.close;
    var align = useContextMenuMenuContext().align;
    var _d = useState({ width: 0, height: 0 }), layout = _d[0], setLayout = _d[1];
    var screenWidth = useWindowDimensions().width;
    // 1 in 100 chance of showing heart eyes icon
    var EmojiIcon = useMemo(function () {
        return Math.random() < 0.01 ? EmojiHeartEyesIcon : EmojiSmileIcon;
    }, []);
    var position = useMemo(function () {
        var _a;
        return {
            x: align === 'left' ? 12 : screenWidth - layout.width - 12,
            y: ((_a = measurement === null || measurement === void 0 ? void 0 : measurement.y) !== null && _a !== void 0 ? _a : 0) - tokens.space.xs - layout.height,
            height: layout.height,
            width: layout.width,
        };
    }, [measurement, align, screenWidth, layout]);
    var limitReacted = hasReachedReactionLimit(message, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var bgColor = t.scheme === 'light' ? t.atoms.bg : t.atoms.bg_contrast_25;
    return (_jsxs(View, { onLayout: function (evt) { return setLayout(evt.nativeEvent.layout); }, style: [
            bgColor,
            a.rounded_full,
            a.absolute,
            { bottom: '100%' },
            isFromSelf ? a.right_0 : a.left_0,
            a.flex_row,
            a.p_xs,
            a.gap_xs,
            a.mb_xs,
            a.z_20,
            a.border,
            t.atoms.border_contrast_low,
            a.shadow_md,
        ], children: [['👍', '😆', '❤️', '👀', '😢'].map(function (emoji) {
                var alreadyReacted = hasAlreadyReacted(message, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did, emoji);
                return (_jsx(ContextMenu.Item, { position: position, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["React with ", ""], ["React with ", ""])), emoji)), onPress: function () { return onEmojiSelect(emoji); }, unstyled: true, disabled: limitReacted ? !alreadyReacted : false, children: function (hovered) { return (_jsx(View, { style: [
                            a.rounded_full,
                            hovered
                                ? {
                                    backgroundColor: alreadyReacted
                                        ? t.palette.negative_100
                                        : t.palette.primary_500,
                                }
                                : alreadyReacted
                                    ? { backgroundColor: t.palette.primary_200 }
                                    : bgColor,
                            { height: 40, width: 40 },
                            a.justify_center,
                            a.align_center,
                        ], children: _jsx(Text, { style: [a.text_center, { fontSize: 30 }], emoji: true, children: emoji }) })); } }, emoji));
            }), _jsx(EmojiPopup, { onEmojiSelected: function (emoji) {
                    close();
                    onEmojiSelect(emoji);
                }, children: _jsx(View, { style: [
                        a.rounded_full,
                        t.scheme === 'light'
                            ? t.atoms.bg_contrast_25
                            : t.atoms.bg_contrast_50,
                        { height: 40, width: 40 },
                        a.justify_center,
                        a.align_center,
                        a.border,
                        t.atoms.border_contrast_low,
                    ], children: _jsx(EmojiIcon, { size: "xl", fill: t.palette.contrast_400 }) }) })] }));
}
var templateObject_1;
