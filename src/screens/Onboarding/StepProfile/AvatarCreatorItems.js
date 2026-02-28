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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { avatarColors, emojiItems, emojiNames, } from '#/screens/Onboarding/StepProfile/types';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { Text } from '#/components/Typography';
var ACTIVE_BORDER_WIDTH = 3;
var ACTIVE_BORDER_STYLES = {
    top: -ACTIVE_BORDER_WIDTH,
    bottom: -ACTIVE_BORDER_WIDTH,
    left: -ACTIVE_BORDER_WIDTH,
    right: -ACTIVE_BORDER_WIDTH,
    opacity: 0.5,
    borderWidth: 3,
};
export function AvatarCreatorItems(_a) {
    var type = _a.type, avatar = _a.avatar, setAvatar = _a.setAvatar;
    var _ = useLingui()._;
    var t = useTheme();
    var isEmojis = type === 'emojis';
    var onSelectEmoji = React.useCallback(function (emoji) {
        setAvatar(function (prev) { return (__assign(__assign({}, prev), { placeholder: emojiItems[emoji] })); });
    }, [setAvatar]);
    var onSelectColor = React.useCallback(function (color) {
        setAvatar(function (prev) { return (__assign(__assign({}, prev), { backgroundColor: color })); });
    }, [setAvatar]);
    return (_jsxs(View, { style: [a.w_full], children: [_jsx(Text, { style: [a.pb_md, t.atoms.text_contrast_medium], children: isEmojis ? (_jsx(Trans, { children: "Select an emoji" })) : (_jsx(Trans, { children: "Select a color" })) }), _jsx(View, { style: [
                    a.flex_row,
                    a.align_start,
                    a.justify_start,
                    a.flex_wrap,
                    a.gap_md,
                ], children: isEmojis
                    ? emojiNames.map(function (emojiName) { return (_jsxs(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Select the ", " emoji as your avatar"], ["Select the ", " emoji as your avatar"])), emojiName)), size: "small", shape: "round", variant: "solid", color: "secondary", onPress: function () { return onSelectEmoji(emojiName); }, children: [_jsx(ButtonIcon, { icon: emojiItems[emojiName].component }), avatar.placeholder.name === emojiName && (_jsx(View, { style: [
                                    a.absolute,
                                    a.rounded_full,
                                    ACTIVE_BORDER_STYLES,
                                    {
                                        borderColor: avatar.backgroundColor,
                                    },
                                ] }))] }, emojiName)); })
                    : avatarColors.map(function (color) { return (_jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Choose this color as your avatar"], ["Choose this color as your avatar"])))), size: "small", shape: "round", variant: "solid", onPress: function () { return onSelectColor(color); }, children: function (ctx) { return (_jsxs(_Fragment, { children: [_jsx(View, { style: [
                                        a.absolute,
                                        a.inset_0,
                                        a.rounded_full,
                                        {
                                            opacity: ctx.hovered || ctx.pressed ? 0.8 : 1,
                                            backgroundColor: color,
                                        },
                                    ] }), avatar.backgroundColor === color && (_jsx(View, { style: [
                                        a.absolute,
                                        a.rounded_full,
                                        ACTIVE_BORDER_STYLES,
                                        {
                                            borderColor: color,
                                        },
                                    ] }))] })); } }, color)); }) })] }));
}
var templateObject_1, templateObject_2;
