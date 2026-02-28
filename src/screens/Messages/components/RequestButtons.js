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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback } from 'react';
import { ChatBskyConvoDefs } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { StackActions, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useEmail } from '#/state/email-verification';
import { useAcceptConversation } from '#/state/queries/messages/accept-conversation';
import { precacheConvoQuery } from '#/state/queries/messages/conversation';
import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { useProfileBlockMutationQueue } from '#/state/queries/profile';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a } from '#/alf';
import { Button, ButtonIcon, ButtonText, } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { EmailDialogScreenID, useEmailDialogControl, } from '#/components/dialogs/EmailDialog';
import { AfterReportDialog } from '#/components/dms/AfterReportDialog';
import { CircleX_Stroke2_Corner0_Rounded } from '#/components/icons/CircleX';
import { Flag_Stroke2_Corner0_Rounded as FlagIcon } from '#/components/icons/Flag';
import { PersonX_Stroke2_Corner0_Rounded as PersonXIcon } from '#/components/icons/Person';
import { Loader } from '#/components/Loader';
import * as Menu from '#/components/Menu';
import { ReportDialog } from '#/components/moderation/ReportDialog';
export function RejectMenu(_a) {
    var convo = _a.convo, profile = _a.profile, _b = _a.size, size = _b === void 0 ? 'tiny' : _b, _c = _a.color, color = _c === void 0 ? 'secondary' : _c, label = _a.label, showDeleteConvo = _a.showDeleteConvo, currentScreen = _a.currentScreen, props = __rest(_a, ["convo", "profile", "size", "color", "label", "showDeleteConvo", "currentScreen"]);
    var _ = useLingui()._;
    var shadowedProfile = useProfileShadow(profile);
    var navigation = useNavigation();
    var leaveConvo = useLeaveConvo(convo.id, {
        onMutate: function () {
            if (currentScreen === 'conversation') {
                navigation.dispatch(StackActions.pop());
            }
        },
        onError: function () {
            Toast.show(_(msg({
                context: 'toast',
                message: 'Failed to delete chat',
            })), 'xmark');
        },
    }).mutate;
    var queueBlock = useProfileBlockMutationQueue(shadowedProfile)[0];
    var onPressDelete = useCallback(function () {
        Toast.show(_(msg({
            context: 'toast',
            message: 'Chat deleted',
        })), 'check');
        leaveConvo();
    }, [leaveConvo, _]);
    var onPressBlock = useCallback(function () {
        Toast.show(_(msg({
            context: 'toast',
            message: 'Account blocked',
        })), 'check');
        // block and also delete convo
        queueBlock();
        leaveConvo();
    }, [queueBlock, leaveConvo, _]);
    var reportControl = useDialogControl();
    var blockOrDeleteControl = useDialogControl();
    var lastMessage = ChatBskyConvoDefs.isMessageView(convo.lastMessage)
        ? convo.lastMessage
        : null;
    return (_jsxs(_Fragment, { children: [_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Reject chat request"], ["Reject chat request"])))), children: function (_a) {
                            var triggerProps = _a.props;
                            return (_jsx(Button, __assign({}, triggerProps, props, { label: triggerProps.accessibilityLabel, style: [a.flex_1], color: color, size: size, children: _jsx(ButtonText, { children: label || (_jsx(Trans, { comment: "Reject a chat request, this opens a menu with options", children: "Reject" })) }) })));
                        } }), _jsx(Menu.Outer, { showCancel: true, children: _jsxs(Menu.Group, { children: [showDeleteConvo && (_jsxs(Menu.Item, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Delete conversation"], ["Delete conversation"])))), onPress: onPressDelete, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Delete conversation" }) }), _jsx(Menu.ItemIcon, { icon: CircleX_Stroke2_Corner0_Rounded })] })), _jsxs(Menu.Item, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Block account"], ["Block account"])))), onPress: onPressBlock, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Block account" }) }), _jsx(Menu.ItemIcon, { icon: PersonXIcon })] }), lastMessage && (_jsxs(Menu.Item, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Report conversation"], ["Report conversation"])))), onPress: reportControl.open, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Report conversation" }) }), _jsx(Menu.ItemIcon, { icon: FlagIcon })] }))] }) })] }), lastMessage && (_jsxs(_Fragment, { children: [_jsx(ReportDialog, { subject: {
                            view: 'convo',
                            convoId: convo.id,
                            message: lastMessage,
                        }, control: reportControl, onAfterSubmit: function () {
                            blockOrDeleteControl.open();
                        } }), _jsx(AfterReportDialog, { control: blockOrDeleteControl, currentScreen: currentScreen, params: {
                            convoId: convo.id,
                            message: lastMessage,
                        } })] }))] }));
}
export function AcceptChatButton(_a) {
    var convo = _a.convo, _b = _a.size, size = _b === void 0 ? 'tiny' : _b, _c = _a.color, color = _c === void 0 ? 'secondary_inverted' : _c, label = _a.label, currentScreen = _a.currentScreen, onAcceptConvo = _a.onAcceptConvo, props = __rest(_a, ["convo", "size", "color", "label", "currentScreen", "onAcceptConvo"]);
    var _ = useLingui()._;
    var queryClient = useQueryClient();
    var navigation = useNavigation();
    var needsEmailVerification = useEmail().needsEmailVerification;
    var emailDialogControl = useEmailDialogControl();
    var _d = useAcceptConversation(convo.id, {
        onMutate: function () {
            onAcceptConvo === null || onAcceptConvo === void 0 ? void 0 : onAcceptConvo();
            if (currentScreen === 'list') {
                precacheConvoQuery(queryClient, __assign(__assign({}, convo), { status: 'accepted' }));
                navigation.navigate('MessagesConversation', {
                    conversation: convo.id,
                    accept: true,
                });
            }
        },
        onError: function () {
            // Should we show a toast here? They'll be on the convo screen, and it'll make
            // no difference if the request failed - when they send a message, the convo will be accepted
            // automatically. The only difference is that when they back out of the convo (without sending a message), the conversation will be rejected.
            // the list will still have this chat in it -sfn
            Toast.show(_(msg({
                context: 'toast',
                message: 'Failed to accept chat',
            })), 'xmark');
        },
    }), acceptConvo = _d.mutate, isPending = _d.isPending;
    var onPressAccept = useCallback(function () {
        if (needsEmailVerification) {
            emailDialogControl.open({
                id: EmailDialogScreenID.Verify,
                instructions: [
                    _jsx(Trans, { children: "Before you can accept this chat request, you must first verify your email." }, "request-btn"),
                ],
            });
        }
        else {
            acceptConvo();
        }
    }, [acceptConvo, needsEmailVerification, emailDialogControl]);
    return (_jsx(Button, __assign({}, props, { label: label || _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Accept chat request"], ["Accept chat request"])))), size: size, color: color, style: a.flex_1, onPress: onPressAccept, children: isPending ? (_jsx(ButtonIcon, { icon: Loader })) : (_jsx(ButtonText, { children: label || _jsx(Trans, { comment: "Accept a chat request", children: "Accept" }) })) })));
}
export function DeleteChatButton(_a) {
    var convo = _a.convo, _b = _a.size, size = _b === void 0 ? 'tiny' : _b, _c = _a.color, color = _c === void 0 ? 'secondary' : _c, label = _a.label, currentScreen = _a.currentScreen, props = __rest(_a, ["convo", "size", "color", "label", "currentScreen"]);
    var _ = useLingui()._;
    var navigation = useNavigation();
    var leaveConvo = useLeaveConvo(convo.id, {
        onMutate: function () {
            if (currentScreen === 'conversation') {
                navigation.dispatch(StackActions.pop());
            }
        },
        onError: function () {
            Toast.show(_(msg({
                context: 'toast',
                message: 'Failed to delete chat',
            })), 'xmark');
        },
    }).mutate;
    var onPressDelete = useCallback(function () {
        Toast.show(_(msg({
            context: 'toast',
            message: 'Chat deleted',
        })), 'check');
        leaveConvo();
    }, [leaveConvo, _]);
    return (_jsx(Button, __assign({ label: label || _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Delete chat"], ["Delete chat"])))), size: size, color: color, style: a.flex_1, onPress: onPressDelete }, props, { children: _jsx(ButtonText, { children: label || _jsx(Trans, { children: "Delete chat" }) }) })));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
