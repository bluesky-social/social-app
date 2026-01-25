var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { logger } from '#/logger';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';
import * as Toast from '#/view/com/util/Toast';
import * as Dialog from '#/components/Dialog';
import { SearchablePeopleList } from '#/components/dialogs/SearchablePeopleList';
import { useAnalytics } from '#/analytics';
export function SendViaChatDialog(_a) {
    var control = _a.control, onSelectChat = _a.onSelectChat;
    return (_jsxs(Dialog.Outer, { control: control, testID: "sendViaChatChatDialog", children: [_jsx(Dialog.Handle, {}), _jsx(SendViaChatDialogInner, { control: control, onSelectChat: onSelectChat })] }));
}
function SendViaChatDialogInner(_a) {
    var control = _a.control, onSelectChat = _a.onSelectChat;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var createChat = useGetConvoForMembers({
        onSuccess: function (data) {
            onSelectChat(data.convo.id);
            if (!data.convo.lastMessage) {
                ax.metric('chat:create', { logContext: 'SendViaChatDialog' });
            }
            ax.metric('chat:open', { logContext: 'SendViaChatDialog' });
        },
        onError: function (error) {
            logger.error('Failed to share post to chat', { message: error });
            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["An issue occurred while trying to open the chat"], ["An issue occurred while trying to open the chat"])))), 'xmark');
        },
    }).mutate;
    var onCreateChat = useCallback(function (did) {
        control.close(function () { return createChat([did]); });
    }, [control, createChat]);
    return (_jsx(SearchablePeopleList, { title: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Send post to..."], ["Send post to..."])))), onSelectChat: onCreateChat, showRecentConvos: true, sortByMessageDeclaration: true }));
}
var templateObject_1, templateObject_2;
