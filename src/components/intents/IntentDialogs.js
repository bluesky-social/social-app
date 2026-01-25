import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import * as Dialog from '#/components/Dialog';
import { VerifyEmailIntentDialog } from '#/components/intents/VerifyEmailIntentDialog';
var Context = React.createContext({});
Context.displayName = 'IntentDialogsContext';
export var useIntentDialogs = function () { return React.useContext(Context); };
export function Provider(_a) {
    var children = _a.children;
    var verifyEmailDialogControl = Dialog.useDialogControl();
    var _b = React.useState(), verifyEmailState = _b[0], setVerifyEmailState = _b[1];
    var value = React.useMemo(function () { return ({
        verifyEmailDialogControl: verifyEmailDialogControl,
        verifyEmailState: verifyEmailState,
        setVerifyEmailState: setVerifyEmailState,
    }); }, [verifyEmailDialogControl, verifyEmailState, setVerifyEmailState]);
    return (_jsxs(Context.Provider, { value: value, children: [children, _jsx(VerifyEmailIntentDialog, {})] }));
}
