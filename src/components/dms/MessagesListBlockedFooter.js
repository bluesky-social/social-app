var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useProfileBlockMutationQueue } from '#/state/queries/profile';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { Divider } from '#/components/Divider';
import { BlockedByListDialog } from '#/components/dms/BlockedByListDialog';
import { LeaveConvoPrompt } from '#/components/dms/LeaveConvoPrompt';
import { ReportConversationPrompt } from '#/components/dms/ReportConversationPrompt';
import { Text } from '#/components/Typography';
export function MessagesListBlockedFooter(_a) {
    var initialRecipient = _a.recipient, convoId = _a.convoId, hasMessages = _a.hasMessages, moderation = _a.moderation;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var _ = useLingui()._;
    var recipient = useProfileShadow(initialRecipient);
    var _b = useProfileBlockMutationQueue(recipient), __ = _b[0], queueUnblock = _b[1];
    var leaveConvoControl = useDialogControl();
    var reportControl = useDialogControl();
    var blockedByListControl = useDialogControl();
    var _c = React.useMemo(function () {
        var modui = moderation.ui('profileView');
        var blocks = modui.alerts.filter(function (alert) { return alert.type === 'blocking'; });
        var listBlocks = blocks.filter(function (alert) { return alert.source.type === 'list'; });
        var userBlock = blocks.find(function (alert) { return alert.source.type === 'user'; });
        return {
            listBlocks: listBlocks,
            userBlock: userBlock,
        };
    }, [moderation]), listBlocks = _c.listBlocks, userBlock = _c.userBlock;
    var isBlocking = !!userBlock || !!listBlocks.length;
    var onUnblockPress = React.useCallback(function () {
        if (listBlocks.length) {
            blockedByListControl.open();
        }
        else {
            queueUnblock();
        }
    }, [blockedByListControl, listBlocks, queueUnblock]);
    return (_jsxs(View, { style: [hasMessages && a.pt_md, a.pb_xl, a.gap_lg], children: [_jsx(Divider, {}), _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.text_center], children: isBlocking ? (_jsx(Trans, { children: "You have blocked this user" })) : (_jsx(Trans, { children: "This user has blocked you" })) }), _jsxs(View, { style: [a.flex_row, a.justify_between, a.gap_lg, a.px_md], children: [_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Leave chat"], ["Leave chat"])))), color: "secondary", variant: "solid", size: "small", style: [a.flex_1], onPress: leaveConvoControl.open, children: _jsx(ButtonText, { style: { color: t.palette.negative_500 }, children: _jsx(Trans, { children: "Leave chat" }) }) }), _jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Report"], ["Report"])))), color: "secondary", variant: "solid", size: "small", style: [a.flex_1], onPress: reportControl.open, children: _jsx(ButtonText, { style: { color: t.palette.negative_500 }, children: _jsx(Trans, { children: "Report" }) }) }), isBlocking && gtMobile && (_jsx(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Unblock"], ["Unblock"])))), color: "secondary", variant: "solid", size: "small", style: [a.flex_1], onPress: onUnblockPress, children: _jsx(ButtonText, { style: { color: t.palette.primary_500 }, children: _jsx(Trans, { children: "Unblock" }) }) }))] }), isBlocking && !gtMobile && (_jsx(View, { style: [a.flex_row, a.justify_center, a.px_md], children: _jsx(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Unblock"], ["Unblock"])))), color: "secondary", variant: "solid", size: "small", style: [a.flex_1], onPress: onUnblockPress, children: _jsx(ButtonText, { style: { color: t.palette.primary_500 }, children: _jsx(Trans, { children: "Unblock" }) }) }) })), _jsx(LeaveConvoPrompt, { control: leaveConvoControl, currentScreen: "conversation", convoId: convoId }), _jsx(ReportConversationPrompt, { control: reportControl }), _jsx(BlockedByListDialog, { control: blockedByListControl, listBlocks: listBlocks })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
