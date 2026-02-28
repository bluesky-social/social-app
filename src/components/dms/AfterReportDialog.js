var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { StackActions, useNavigation } from '@react-navigation/native';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { useProfileBlockMutationQueue, useProfileQuery, } from '#/state/queries/profile';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, platform, useBreakpoints, useTheme, web } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as Toggle from '#/components/forms/Toggle';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
/**
 * Dialog shown after a report is submitted, allowing the user to block the
 * reporter and/or leave the conversation.
 */
export var AfterReportDialog = memo(function BlockOrDeleteDialogInner(_a) {
    var control = _a.control, params = _a.params, currentScreen = _a.currentScreen;
    var _ = useLingui()._;
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Would you like to block this user and/or delete this conversation?"], ["Would you like to block this user and/or delete this conversation?"])))), style: [web({ maxWidth: 400 })], children: [_jsx(DialogInner, { params: params, currentScreen: currentScreen }), _jsx(Dialog.Close, {})] })] }));
});
function DialogInner(_a) {
    var params = _a.params, currentScreen = _a.currentScreen;
    var t = useTheme();
    var _ = useLingui()._;
    var control = Dialog.useDialogContext();
    var _b = useProfileQuery({
        did: params.message.sender.did,
    }), profile = _b.data, isLoading = _b.isLoading, isError = _b.isError;
    return isLoading ? (_jsx(View, { style: [a.w_full, a.py_5xl, a.align_center], children: _jsx(Loader, { size: "lg" }) })) : isError || !profile ? (_jsxs(View, { style: [a.w_full, a.gap_lg], children: [_jsxs(View, { style: [a.justify_center, a.gap_sm], children: [_jsx(Text, { style: [a.text_2xl, a.font_semi_bold], children: _jsx(Trans, { children: "Report submitted" }) }), _jsx(Text, { style: [a.text_md, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Our moderation team has received your report." }) })] }), _jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Close"], ["Close"])))), onPress: function () { return control.close(); }, size: platform({ native: 'small', web: 'large' }), color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) })] })) : (_jsx(DoneStep, { convoId: params.convoId, currentScreen: currentScreen, profile: profile }));
}
function DoneStep(_a) {
    var convoId = _a.convoId, currentScreen = _a.currentScreen, profile = _a.profile;
    var _ = useLingui()._;
    var navigation = useNavigation();
    var control = Dialog.useDialogContext();
    var gtMobile = useBreakpoints().gtMobile;
    var t = useTheme();
    var _b = useState(['block', 'leave']), actions = _b[0], setActions = _b[1];
    var shadow = useProfileShadow(profile);
    var queueBlock = useProfileBlockMutationQueue(shadow)[0];
    var leaveConvo = useLeaveConvo(convoId, {
        onMutate: function () {
            if (currentScreen === 'conversation') {
                navigation.dispatch(StackActions.replace('Messages', IS_NATIVE ? { animation: 'pop' } : {}));
            }
        },
        onError: function () {
            Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Could not leave chat"], ["Could not leave chat"])))), 'xmark');
        },
    }).mutate;
    var btnText = _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Done"], ["Done"]))));
    var toastMsg;
    if (actions.includes('leave') && actions.includes('block')) {
        btnText = _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Block and Delete"], ["Block and Delete"]))));
        toastMsg = _(msg({ message: 'Conversation deleted', context: 'toast' }));
    }
    else if (actions.includes('leave')) {
        btnText = _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Delete Conversation"], ["Delete Conversation"]))));
        toastMsg = _(msg({ message: 'Conversation deleted', context: 'toast' }));
    }
    else if (actions.includes('block')) {
        btnText = _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Block User"], ["Block User"]))));
        toastMsg = _(msg({ message: 'User blocked', context: 'toast' }));
    }
    var onPressPrimaryAction = function () {
        control.close(function () {
            if (actions.includes('block')) {
                queueBlock();
            }
            if (actions.includes('leave')) {
                leaveConvo();
            }
            if (toastMsg) {
                Toast.show(toastMsg, 'check');
            }
        });
    };
    return (_jsxs(View, { style: a.gap_2xl, children: [_jsxs(View, { style: [a.justify_center, gtMobile ? a.gap_sm : a.gap_xs], children: [_jsx(Text, { style: [a.text_2xl, a.font_semi_bold], children: _jsx(Trans, { children: "Report submitted" }) }), _jsx(Text, { style: [a.text_md, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Our moderation team has received your report." }) })] }), _jsx(Toggle.Group, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Block user and/or delete this conversation"], ["Block user and/or delete this conversation"])))), values: actions, onChange: setActions, children: _jsxs(View, { style: [a.gap_md], children: [_jsxs(Toggle.Item, { name: "block", label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Block user"], ["Block user"])))), children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { style: [a.text_md], children: _jsx(Trans, { children: "Block user" }) })] }), _jsxs(Toggle.Item, { name: "leave", label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Delete conversation"], ["Delete conversation"])))), children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { style: [a.text_md], children: _jsx(Trans, { children: "Delete conversation" }) })] })] }) }), _jsxs(View, { style: [a.gap_sm], children: [_jsx(Button, { label: btnText, onPress: onPressPrimaryAction, size: "large", color: actions.length > 0 ? 'negative' : 'primary', children: _jsx(ButtonText, { children: btnText }) }), _jsx(Button, { label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Close"], ["Close"])))), onPress: function () { return control.close(); }, size: "large", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11;
