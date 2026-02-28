var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { web } from '#/alf';
import * as Dialog from '#/components/Dialog';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { useAccountEmailState } from '#/components/dialogs/EmailDialog/data/useAccountEmailState';
import { Manage2FA } from '#/components/dialogs/EmailDialog/screens/Manage2FA';
import { Update } from '#/components/dialogs/EmailDialog/screens/Update';
import { VerificationReminder } from '#/components/dialogs/EmailDialog/screens/VerificationReminder';
import { Verify } from '#/components/dialogs/EmailDialog/screens/Verify';
import { ScreenID } from '#/components/dialogs/EmailDialog/types';
export { ScreenID as EmailDialogScreenID } from '#/components/dialogs/EmailDialog/types';
export function useEmailDialogControl() {
    return useGlobalDialogsControlContext().emailDialogControl;
}
export function EmailDialog() {
    var _ = useLingui()._;
    var emailDialogControl = useEmailDialogControl();
    var isEmailVerified = useAccountEmailState().isEmailVerified;
    var onClose = useCallback(function () {
        var _a, _b, _c;
        if (!isEmailVerified) {
            if (((_a = emailDialogControl.value) === null || _a === void 0 ? void 0 : _a.id) === ScreenID.Verify) {
                (_c = (_b = emailDialogControl.value).onCloseWithoutVerifying) === null || _c === void 0 ? void 0 : _c.call(_b);
            }
        }
        emailDialogControl.clear();
    }, [isEmailVerified, emailDialogControl]);
    return (_jsxs(Dialog.Outer, { control: emailDialogControl.control, onClose: onClose, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Make adjustments to email settings for your account"], ["Make adjustments to email settings for your account"])))), style: web({ maxWidth: 400 }), children: [_jsx(Inner, { control: emailDialogControl }), _jsx(Dialog.Close, {})] })] }));
}
function Inner(_a) {
    var control = _a.control;
    var _b = useState(function () { return control.value; }), screen = _b[0], showScreen = _b[1];
    if (!screen)
        return null;
    switch (screen.id) {
        case ScreenID.Update: {
            return _jsx(Update, { config: screen, showScreen: showScreen });
        }
        case ScreenID.Verify: {
            return _jsx(Verify, { config: screen, showScreen: showScreen });
        }
        case ScreenID.VerificationReminder: {
            return _jsx(VerificationReminder, { config: screen, showScreen: showScreen });
        }
        case ScreenID.Manage2FA: {
            return _jsx(Manage2FA, { config: screen, showScreen: showScreen });
        }
        default: {
            return null;
        }
    }
}
var templateObject_1;
