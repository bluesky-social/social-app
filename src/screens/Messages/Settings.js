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
import { useCallback } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useUpdateActorDeclaration } from '#/state/queries/messages/actor-declaration';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Divider } from '#/components/Divider';
import * as Toggle from '#/components/forms/Toggle';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
import { useBackgroundNotificationPreferences } from '../../../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider';
export function MessagesSettingsScreen(props) {
    return _jsx(MessagesSettingsScreenInner, __assign({}, props));
}
export function MessagesSettingsScreenInner(_a) {
    var _b, _c, _d;
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var profile = useProfileQuery({
        did: currentAccount.did,
    }).data;
    var _e = useBackgroundNotificationPreferences(), preferences = _e.preferences, setPref = _e.setPref;
    var updateDeclaration = useUpdateActorDeclaration({
        onError: function () {
            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Failed to update settings"], ["Failed to update settings"])))), 'xmark');
        },
    }).mutate;
    var onSelectMessagesFrom = useCallback(function (keys) {
        var key = keys[0];
        if (!key)
            return;
        updateDeclaration(key);
    }, [updateDeclaration]);
    var onSelectSoundSetting = useCallback(function (keys) {
        var key = keys[0];
        if (!key)
            return;
        setPref('playSoundChat', key === 'enabled');
    }, [setPref]);
    return (_jsxs(Layout.Screen, { testID: "messagesSettingsScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Chat Settings" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(View, { style: [a.p_lg, a.gap_md], children: [_jsx(Text, { style: [a.text_lg, a.font_semi_bold], children: _jsx(Trans, { children: "Allow new messages from" }) }), _jsx(Toggle.Group, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Allow new messages from"], ["Allow new messages from"])))), type: "radio", values: [
                                (_d = (_c = (_b = profile === null || profile === void 0 ? void 0 : profile.associated) === null || _b === void 0 ? void 0 : _b.chat) === null || _c === void 0 ? void 0 : _c.allowIncoming) !== null && _d !== void 0 ? _d : 'following',
                            ], onChange: onSelectMessagesFrom, children: _jsxs(View, { children: [_jsxs(Toggle.Item, { name: "all", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Everyone"], ["Everyone"])))), style: [a.justify_between, a.py_sm], children: [_jsx(Toggle.LabelText, { children: _jsx(Trans, { children: "Everyone" }) }), _jsx(Toggle.Radio, {})] }), _jsxs(Toggle.Item, { name: "following", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Users I follow"], ["Users I follow"])))), style: [a.justify_between, a.py_sm], children: [_jsx(Toggle.LabelText, { children: _jsx(Trans, { children: "Users I follow" }) }), _jsx(Toggle.Radio, {})] }), _jsxs(Toggle.Item, { name: "none", label: _(msg({ context: 'allow messages from', message: "No one" })), style: [a.justify_between, a.py_sm], children: [_jsx(Toggle.LabelText, { children: _jsx(Trans, { context: "allow messages from", children: "No one" }) }), _jsx(Toggle.Radio, {})] })] }) }), _jsx(Admonition, { type: "tip", children: _jsx(Trans, { children: "You can continue ongoing conversations regardless of which setting you choose." }) }), IS_NATIVE && (_jsxs(_Fragment, { children: [_jsx(Divider, { style: a.my_md }), _jsx(Text, { style: [a.text_lg, a.font_semi_bold], children: _jsx(Trans, { children: "Notification Sounds" }) }), _jsx(Toggle.Group, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Notification sounds"], ["Notification sounds"])))), type: "radio", values: [preferences.playSoundChat ? 'enabled' : 'disabled'], onChange: onSelectSoundSetting, children: _jsxs(View, { children: [_jsxs(Toggle.Item, { name: "enabled", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Enabled"], ["Enabled"])))), style: [a.justify_between, a.py_sm], children: [_jsx(Toggle.LabelText, { children: _jsx(Trans, { children: "Enabled" }) }), _jsx(Toggle.Radio, {})] }), _jsxs(Toggle.Item, { name: "disabled", label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Disabled"], ["Disabled"])))), style: [a.justify_between, a.py_sm], children: [_jsx(Toggle.LabelText, { children: _jsx(Trans, { children: "Disabled" }) }), _jsx(Toggle.Radio, {})] })] }) })] }))] }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
