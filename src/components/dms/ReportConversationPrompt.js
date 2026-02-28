var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import * as Prompt from '#/components/Prompt';
export function ReportConversationPrompt(_a) {
    var control = _a.control;
    var _ = useLingui()._;
    return (_jsx(Prompt.Basic, { control: control, title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Report conversation"], ["Report conversation"])))), description: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["To report a conversation, please report one of its messages via the conversation screen. This lets our moderators understand the context of your issue."], ["To report a conversation, please report one of its messages via the conversation screen. This lets our moderators understand the context of your issue."])))), confirmButtonCta: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["I understand"], ["I understand"])))), onConfirm: function () { }, showCancel: false }));
}
var templateObject_1, templateObject_2, templateObject_3;
