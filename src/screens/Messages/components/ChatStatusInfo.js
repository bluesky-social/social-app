var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';
import { atoms as a, useTheme } from '#/alf';
import { LeaveConvoPrompt } from '#/components/dms/LeaveConvoPrompt';
import { KnownFollowers } from '#/components/KnownFollowers';
import { usePromptControl } from '#/components/Prompt';
import { AcceptChatButton, DeleteChatButton, RejectMenu } from './RequestButtons';
export function ChatStatusInfo(_a) {
    var convoState = _a.convoState;
    var t = useTheme();
    var _ = useLingui()._;
    var moderationOpts = useModerationOpts();
    var currentAccount = useSession().currentAccount;
    var leaveConvoControl = usePromptControl();
    var onAcceptChat = useCallback(function () {
        convoState.markConvoAccepted();
    }, [convoState]);
    var otherUser = convoState.recipients.find(function (user) { return user.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did); });
    if (!moderationOpts) {
        return null;
    }
    return (_jsxs(View, { style: [t.atoms.bg, a.p_lg, a.gap_md, a.align_center], children: [otherUser && (_jsx(KnownFollowers, { profile: otherUser, moderationOpts: moderationOpts, showIfEmpty: true })), _jsxs(View, { style: [a.flex_row, a.gap_md, a.w_full, otherUser && a.pt_sm], children: [otherUser && (_jsx(RejectMenu, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Block or report"], ["Block or report"])))), convo: convoState.convo, profile: otherUser, color: "negative_subtle", size: "small", currentScreen: "conversation" })), _jsx(DeleteChatButton, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Delete"], ["Delete"])))), convo: convoState.convo, color: "secondary", size: "small", currentScreen: "conversation", onPress: leaveConvoControl.open }), _jsx(LeaveConvoPrompt, { convoId: convoState.convo.id, control: leaveConvoControl, currentScreen: "conversation", hasMessages: false })] }), _jsx(View, { style: [a.w_full, a.flex_row], children: _jsx(AcceptChatButton, { onAcceptConvo: onAcceptChat, convo: convoState.convo, color: "primary_subtle", size: "small", currentScreen: "conversation" }) })] }));
}
var templateObject_1, templateObject_2;
