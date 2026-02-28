var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback } from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useRequireEmailVerification } from '#/lib/hooks/useRequireEmailVerification';
import { logger } from '#/logger';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';
import { FAB } from '#/view/com/util/fab/FAB';
import * as Toast from '#/view/com/util/Toast';
import { useTheme } from '#/alf';
import * as Dialog from '#/components/Dialog';
import { SearchablePeopleList } from '#/components/dialogs/SearchablePeopleList';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { useAnalytics } from '#/analytics';
export function NewChat(_a) {
    var control = _a.control, onNewChat = _a.onNewChat;
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var requireEmailVerification = useRequireEmailVerification();
    var createChat = useGetConvoForMembers({
        onSuccess: function (data) {
            onNewChat(data.convo.id);
            if (!data.convo.lastMessage) {
                ax.metric('chat:create', { logContext: 'NewChatDialog' });
            }
            ax.metric('chat:open', { logContext: 'NewChatDialog' });
        },
        onError: function (error) {
            logger.error('Failed to create chat', { safeMessage: error });
            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["An issue occurred starting the chat"], ["An issue occurred starting the chat"])))), 'xmark');
        },
    }).mutate;
    var onCreateChat = useCallback(function (did) {
        control.close(function () { return createChat([did]); });
    }, [control, createChat]);
    var onPress = useCallback(function () {
        control.open();
    }, [control]);
    var wrappedOnPress = requireEmailVerification(onPress, {
        instructions: [
            _jsx(Trans, { children: "Before you can message another user, you must first verify your email." }, "new-chat"),
        ],
    });
    return (_jsxs(_Fragment, { children: [_jsx(FAB, { testID: "newChatFAB", onPress: wrappedOnPress, icon: _jsx(Plus, { size: "lg", fill: t.palette.white }), accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["New chat"], ["New chat"])))), accessibilityHint: "" }), _jsxs(Dialog.Outer, { control: control, testID: "newChatDialog", children: [_jsx(Dialog.Handle, {}), _jsx(SearchablePeopleList, { title: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Start a new chat"], ["Start a new chat"])))), onSelectChat: onCreateChat, sortByMessageDeclaration: true })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
