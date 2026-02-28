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
import React, { useCallback } from 'react';
import { Keyboard, View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { useConvoQuery, useMarkAsReadMutation, } from '#/state/queries/messages/conversation';
import { useMuteConvo } from '#/state/queries/messages/mute-conversation';
import { useProfileBlockMutationQueue } from '#/state/queries/profile';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { AfterReportDialog } from '#/components/dms/AfterReportDialog';
import { BlockedByListDialog } from '#/components/dms/BlockedByListDialog';
import { LeaveConvoPrompt } from '#/components/dms/LeaveConvoPrompt';
import { ReportConversationPrompt } from '#/components/dms/ReportConversationPrompt';
import { ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeft } from '#/components/icons/ArrowBoxLeft';
import { Bubble_Stroke2_Corner2_Rounded as Bubble } from '#/components/icons/Bubble';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontal } from '#/components/icons/DotGrid';
import { Flag_Stroke2_Corner0_Rounded as Flag } from '#/components/icons/Flag';
import { Mute_Stroke2_Corner0_Rounded as Mute } from '#/components/icons/Mute';
import { Person_Stroke2_Corner0_Rounded as Person, PersonCheck_Stroke2_Corner0_Rounded as PersonCheck, PersonX_Stroke2_Corner0_Rounded as PersonX, } from '#/components/icons/Person';
import { SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute } from '#/components/icons/Speaker';
import * as Menu from '#/components/Menu';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
var ConvoMenu = function (_a) {
    var convo = _a.convo, profile = _a.profile, control = _a.control, currentScreen = _a.currentScreen, showMarkAsRead = _a.showMarkAsRead, hideTrigger = _a.hideTrigger, blockInfo = _a.blockInfo, latestReportableMessage = _a.latestReportableMessage, style = _a.style;
    var _ = useLingui()._;
    var leaveConvoControl = Prompt.usePromptControl();
    var reportControl = Prompt.usePromptControl();
    var blockedByListControl = Prompt.usePromptControl();
    var blockOrDeleteControl = Prompt.usePromptControl();
    var listBlocks = blockInfo.listBlocks;
    return (_jsxs(_Fragment, { children: [_jsxs(Menu.Root, { control: control, children: [!hideTrigger && (_jsx(View, { style: [style], children: _jsx(Menu.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Chat settings"], ["Chat settings"])))), children: function (_a) {
                                var props = _a.props;
                                return (_jsx(Button, __assign({ label: props.accessibilityLabel }, props, { onPress: function () {
                                        Keyboard.dismiss();
                                        props.onPress();
                                    }, size: "small", color: "secondary", shape: "round", variant: "ghost", style: [a.bg_transparent], children: _jsx(ButtonIcon, { icon: DotsHorizontal, size: "md" }) })));
                            } }) })), _jsx(Menu.Outer, { children: _jsx(MenuContent, { profile: profile, showMarkAsRead: showMarkAsRead, blockInfo: blockInfo, convo: convo, leaveConvoControl: leaveConvoControl, reportControl: reportControl, blockedByListControl: blockedByListControl }) })] }), _jsx(LeaveConvoPrompt, { control: leaveConvoControl, convoId: convo.id, currentScreen: currentScreen }), latestReportableMessage ? (_jsxs(_Fragment, { children: [_jsx(ReportDialog, { subject: {
                            view: 'convo',
                            convoId: convo.id,
                            message: latestReportableMessage,
                        }, control: reportControl, onAfterSubmit: function () {
                            blockOrDeleteControl.open();
                        } }), _jsx(AfterReportDialog, { control: blockOrDeleteControl, currentScreen: currentScreen, params: {
                            convoId: convo.id,
                            message: latestReportableMessage,
                        } })] })) : (_jsx(ReportConversationPrompt, { control: reportControl })), _jsx(BlockedByListDialog, { control: blockedByListControl, listBlocks: listBlocks })] }));
};
ConvoMenu = React.memo(ConvoMenu);
function MenuContent(_a) {
    var initialConvo = _a.convo, profile = _a.profile, showMarkAsRead = _a.showMarkAsRead, blockInfo = _a.blockInfo, leaveConvoControl = _a.leaveConvoControl, reportControl = _a.reportControl, blockedByListControl = _a.blockedByListControl;
    var navigation = useNavigation();
    var _ = useLingui()._;
    var markAsRead = useMarkAsReadMutation().mutate;
    var listBlocks = blockInfo.listBlocks, userBlock = blockInfo.userBlock;
    var isBlocking = userBlock || !!listBlocks.length;
    var isDeletedAccount = profile.handle === 'missing.invalid';
    var convoId = initialConvo.id;
    var convo = useConvoQuery(initialConvo).data;
    var onNavigateToProfile = useCallback(function () {
        navigation.navigate('Profile', { name: profile.did });
    }, [navigation, profile.did]);
    var muteConvo = useMuteConvo(convoId, {
        onSuccess: function (data) {
            if (data.convo.muted) {
                Toast.show(_(msg({ message: 'Chat muted', context: 'toast' })));
            }
            else {
                Toast.show(_(msg({ message: 'Chat unmuted', context: 'toast' })));
            }
        },
        onError: function () {
            Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Could not mute chat"], ["Could not mute chat"])))), 'xmark');
        },
    }).mutate;
    var _b = useProfileBlockMutationQueue(profile), queueBlock = _b[0], queueUnblock = _b[1];
    var toggleBlock = React.useCallback(function () {
        if (listBlocks.length) {
            blockedByListControl.open();
            return;
        }
        if (userBlock) {
            queueUnblock();
        }
        else {
            queueBlock();
        }
    }, [userBlock, listBlocks, blockedByListControl, queueBlock, queueUnblock]);
    return isDeletedAccount ? (_jsxs(Menu.Item, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Leave conversation"], ["Leave conversation"])))), onPress: function () { return leaveConvoControl.open(); }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Leave conversation" }) }), _jsx(Menu.ItemIcon, { icon: ArrowBoxLeft })] })) : (_jsxs(_Fragment, { children: [_jsxs(Menu.Group, { children: [showMarkAsRead && (_jsxs(Menu.Item, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Mark as read"], ["Mark as read"])))), onPress: function () { return markAsRead({ convoId: convoId }); }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Mark as read" }) }), _jsx(Menu.ItemIcon, { icon: Bubble })] })), _jsxs(Menu.Item, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Go to user's profile"], ["Go to user's profile"])))), onPress: onNavigateToProfile, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Go to profile" }) }), _jsx(Menu.ItemIcon, { icon: Person })] }), _jsxs(Menu.Item, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Mute conversation"], ["Mute conversation"])))), onPress: function () { return muteConvo({ mute: !(convo === null || convo === void 0 ? void 0 : convo.muted) }); }, children: [_jsx(Menu.ItemText, { children: (convo === null || convo === void 0 ? void 0 : convo.muted) ? (_jsx(Trans, { children: "Unmute conversation" })) : (_jsx(Trans, { children: "Mute conversation" })) }), _jsx(Menu.ItemIcon, { icon: (convo === null || convo === void 0 ? void 0 : convo.muted) ? Unmute : Mute })] })] }), _jsx(Menu.Divider, {}), _jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { label: isBlocking ? _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Unblock account"], ["Unblock account"])))) : _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Block account"], ["Block account"])))), onPress: toggleBlock, children: [_jsx(Menu.ItemText, { children: isBlocking ? _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Unblock account"], ["Unblock account"])))) : _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Block account"], ["Block account"])))) }), _jsx(Menu.ItemIcon, { icon: isBlocking ? PersonCheck : PersonX })] }), _jsxs(Menu.Item, { label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Report conversation"], ["Report conversation"])))), onPress: function () { return reportControl.open(); }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Report conversation" }) }), _jsx(Menu.ItemIcon, { icon: Flag })] })] }), _jsx(Menu.Divider, {}), _jsx(Menu.Group, { children: _jsxs(Menu.Item, { label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Leave conversation"], ["Leave conversation"])))), onPress: function () { return leaveConvoControl.open(); }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Leave conversation" }) }), _jsx(Menu.ItemIcon, { icon: ArrowBoxLeft })] }) })] }));
}
export { ConvoMenu };
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12;
