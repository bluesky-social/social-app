var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { ConvoItemError } from '#/state/messages/convo/types';
import { atoms as a, useTheme } from '#/alf';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';
export function MessageListError(_a) {
    var item = _a.item;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = React.useMemo(function () {
        var _a;
        return (_a = {},
            _a[ConvoItemError.FirehoseFailed] = {
                description: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["This chat was disconnected"], ["This chat was disconnected"])))),
                help: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Press to attempt reconnection"], ["Press to attempt reconnection"])))),
                cta: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Reconnect"], ["Reconnect"])))),
            },
            _a[ConvoItemError.HistoryFailed] = {
                description: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Failed to load past messages"], ["Failed to load past messages"])))),
                help: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Press to retry"], ["Press to retry"])))),
                cta: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Retry"], ["Retry"])))),
            },
            _a)[item.code];
    }, [_, item.code]), description = _b.description, help = _b.help, cta = _b.cta;
    return (_jsx(View, { style: [a.py_md, a.w_full, a.flex_row, a.justify_center], children: _jsxs(View, { style: [
                a.flex_1,
                a.flex_row,
                a.align_center,
                a.justify_center,
                a.gap_sm,
                { maxWidth: 400 },
            ], children: [_jsx(CircleInfo, { size: "sm", fill: t.palette.negative_400 }), _jsxs(Text, { style: [a.leading_snug, t.atoms.text_contrast_medium], children: [description, " \u00B7", ' ', item.retry && (_jsx(InlineLinkText, { to: "#", label: help, onPress: function (e) {
                                var _a;
                                e.preventDefault();
                                (_a = item.retry) === null || _a === void 0 ? void 0 : _a.call(item);
                                return false;
                            }, children: cta }))] })] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
