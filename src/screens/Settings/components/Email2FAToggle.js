var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useSession } from '#/state/session';
import { useDialogControl } from '#/components/Dialog';
import { EmailDialogScreenID, useEmailDialogControl, } from '#/components/dialogs/EmailDialog';
import { DisableEmail2FADialog } from './DisableEmail2FADialog';
import * as SettingsList from './SettingsList';
export function Email2FAToggle() {
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var disableDialogControl = useDialogControl();
    var emailDialogControl = useEmailDialogControl();
    var onToggle = React.useCallback(function () {
        emailDialogControl.open({
            id: EmailDialogScreenID.Manage2FA,
        });
    }, [emailDialogControl]);
    return (_jsxs(_Fragment, { children: [_jsx(DisableEmail2FADialog, { control: disableDialogControl }), _jsx(SettingsList.BadgeButton, { label: (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.emailAuthFactor) ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Change"], ["Change"])))) : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Enable"], ["Enable"])))), onPress: onToggle })] }));
}
var templateObject_1, templateObject_2;
