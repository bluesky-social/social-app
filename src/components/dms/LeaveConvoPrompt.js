var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { StackActions, useNavigation } from '@react-navigation/native';
import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import * as Toast from '#/view/com/util/Toast';
import * as Prompt from '#/components/Prompt';
import { IS_NATIVE } from '#/env';
export function LeaveConvoPrompt(_a) {
    var control = _a.control, convoId = _a.convoId, currentScreen = _a.currentScreen, _b = _a.hasMessages, hasMessages = _b === void 0 ? true : _b;
    var _ = useLingui()._;
    var navigation = useNavigation();
    var leaveConvo = useLeaveConvo(convoId, {
        onMutate: function () {
            if (currentScreen === 'conversation') {
                navigation.dispatch(StackActions.replace('Messages', IS_NATIVE ? { animation: 'pop' } : {}));
            }
        },
        onError: function () {
            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Could not leave chat"], ["Could not leave chat"])))), 'xmark');
        },
    }).mutate;
    return (_jsx(Prompt.Basic, { control: control, title: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Leave conversation"], ["Leave conversation"])))), description: hasMessages
            ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Are you sure you want to leave this conversation? Your messages will be deleted for you, but not for the other participant."], ["Are you sure you want to leave this conversation? Your messages will be deleted for you, but not for the other participant."]))))
            : _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Are you sure you want to leave this conversation?"], ["Are you sure you want to leave this conversation?"])))), confirmButtonCta: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Leave"], ["Leave"])))), confirmButtonColor: "negative", onConfirm: function () { return leaveConvo(); } }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
