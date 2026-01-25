var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { listUriToHref } from '#/lib/strings/url-helpers';
import { atoms as a, useTheme } from '#/alf';
import * as Dialog from '#/components/Dialog';
import { InlineLinkText } from '#/components/Link';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';
export function BlockedByListDialog(_a) {
    var control = _a.control, listBlocks = _a.listBlocks;
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsxs(Prompt.Outer, { control: control, testID: "blockedByListDialog", children: [_jsx(Prompt.TitleText, { children: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["User blocked by list"], ["User blocked by list"])))) }), _jsxs(View, { style: [a.gap_sm, a.pb_lg], children: [_jsxs(Text, { selectable: true, style: [a.text_md, a.leading_snug, t.atoms.text_contrast_high], children: [_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["This account is blocked by one or more of your moderation lists. To unblock, please visit the lists directly and remove this user."], ["This account is blocked by one or more of your moderation lists. To unblock, please visit the lists directly and remove this user."])))), ' '] }), _jsxs(Text, { style: [a.text_md, a.leading_snug, t.atoms.text_contrast_high], children: [_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Lists blocking this user:"], ["Lists blocking this user:"])))), ' ', listBlocks.map(function (block, i) {
                                return block.source.type === 'list' ? (_jsxs(React.Fragment, { children: [i === 0 ? null : ', ', _jsx(InlineLinkText, { label: block.source.list.name, to: listUriToHref(block.source.list.uri), style: [a.text_md, a.leading_snug], children: block.source.list.name })] }, block.source.list.uri)) : null;
                            })] })] }), _jsx(Prompt.Actions, { children: _jsx(Prompt.Action, { cta: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["I understand"], ["I understand"])))), onPress: function () { } }) }), _jsx(Dialog.Close, {})] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
