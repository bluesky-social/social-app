import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useState } from 'react';
import * as Dialog from '#/components/Dialog';
var ControlsContext = createContext(null);
ControlsContext.displayName = 'GlobalDialogControlsContext';
export function useGlobalDialogsControlContext() {
    var ctx = useContext(ControlsContext);
    if (!ctx) {
        throw new Error('useGlobalDialogsControlContext must be used within a Provider');
    }
    return ctx;
}
export function Provider(_a) {
    var children = _a.children;
    var mutedWordsDialogControl = Dialog.useDialogControl();
    var signinDialogControl = Dialog.useDialogControl();
    var inAppBrowserConsentControl = useStatefulDialogControl();
    var emailDialogControl = useStatefulDialogControl();
    var linkWarningDialogControl = useStatefulDialogControl();
    var ageAssuranceRedirectDialogControl = useStatefulDialogControl();
    var reportDialogControl = useStatefulDialogControl();
    var ctx = useMemo(function () { return ({
        mutedWordsDialogControl: mutedWordsDialogControl,
        signinDialogControl: signinDialogControl,
        inAppBrowserConsentControl: inAppBrowserConsentControl,
        emailDialogControl: emailDialogControl,
        linkWarningDialogControl: linkWarningDialogControl,
        ageAssuranceRedirectDialogControl: ageAssuranceRedirectDialogControl,
        reportDialogControl: reportDialogControl,
    }); }, [
        mutedWordsDialogControl,
        signinDialogControl,
        inAppBrowserConsentControl,
        emailDialogControl,
        linkWarningDialogControl,
        ageAssuranceRedirectDialogControl,
        reportDialogControl,
    ]);
    return (_jsx(ControlsContext.Provider, { value: ctx, children: children }));
}
export function useStatefulDialogControl(initialValue) {
    var _a = useState(initialValue), value = _a[0], setValue = _a[1];
    var control = Dialog.useDialogControl();
    return useMemo(function () { return ({
        control: control,
        open: function (v) {
            setValue(v);
            control.open();
        },
        clear: function () { return setValue(initialValue); },
        value: value,
    }); }, [control, value, initialValue]);
}
