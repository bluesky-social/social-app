var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { useRequireEmailVerification } from '#/lib/hooks/useRequireEmailVerification';
import { useGetConvoAvailabilityQuery } from '#/state/queries/messages/get-convo-availability';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { canBeMessaged } from '#/components/dms/util';
import { Message_Stroke2_Corner0_Rounded as Message } from '#/components/icons/Message';
import { useAnalytics } from '#/analytics';
export function MessageProfileButton(_a) {
    var profile = _a.profile;
    var _ = useLingui()._;
    var t = useTheme();
    var ax = useAnalytics();
    var navigation = useNavigation();
    var requireEmailVerification = useRequireEmailVerification();
    var convoAvailability = useGetConvoAvailabilityQuery(profile.did).data;
    var initiateConvo = useGetConvoForMembers({
        onSuccess: function (_a) {
            var convo = _a.convo;
            ax.metric('chat:open', { logContext: 'ProfileHeader' });
            navigation.navigate('MessagesConversation', { conversation: convo.id });
        },
        onError: function () {
            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Failed to create conversation"], ["Failed to create conversation"])))));
        },
    }).mutate;
    var onPress = React.useCallback(function () {
        if (!(convoAvailability === null || convoAvailability === void 0 ? void 0 : convoAvailability.canChat)) {
            return;
        }
        if (convoAvailability.convo) {
            ax.metric('chat:open', { logContext: 'ProfileHeader' });
            navigation.navigate('MessagesConversation', {
                conversation: convoAvailability.convo.id,
            });
        }
        else {
            ax.metric('chat:create', { logContext: 'ProfileHeader' });
            initiateConvo([profile.did]);
        }
    }, [ax, navigation, profile.did, initiateConvo, convoAvailability]);
    var wrappedOnPress = requireEmailVerification(onPress, {
        instructions: [
            _jsx(Trans, { children: "Before you can message another user, you must first verify your email." }, "message"),
        ],
    });
    if (!convoAvailability) {
        // show pending state based on declaration
        if (canBeMessaged(profile)) {
            return (_jsx(View, { testID: "dmBtnLoading", "aria-hidden": true, style: [
                    a.justify_center,
                    a.align_center,
                    t.atoms.bg_contrast_25,
                    a.rounded_full,
                    // Matches size of button below to avoid layout shift
                    { width: 33, height: 33 },
                ], children: _jsx(Message, { style: [t.atoms.text, { opacity: 0.3 }], size: "md" }) }));
        }
        else {
            return null;
        }
    }
    if (convoAvailability.canChat) {
        return (_jsx(_Fragment, { children: _jsx(Button, { accessibilityRole: "button", testID: "dmBtn", size: "small", color: "secondary", variant: "solid", shape: "round", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Message ", ""], ["Message ", ""])), profile.handle)), style: [a.justify_center], onPress: wrappedOnPress, children: _jsx(ButtonIcon, { icon: Message, size: "md" }) }) }));
    }
    else {
        return null;
    }
}
var templateObject_1, templateObject_2;
