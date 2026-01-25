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
import { useCallback } from 'react';
import { Keyboard } from 'react-native';
import { useEmail } from '#/state/email-verification';
import { useRequireAuth, useSession } from '#/state/session';
import { useCloseAllActiveElements } from '#/state/util';
import { EmailDialogScreenID, useEmailDialogControl, } from '#/components/dialogs/EmailDialog';
export function useRequireEmailVerification() {
    var currentAccount = useSession().currentAccount;
    var needsEmailVerification = useEmail().needsEmailVerification;
    var requireAuth = useRequireAuth();
    var emailDialogControl = useEmailDialogControl();
    var closeAll = useCloseAllActiveElements();
    return useCallback(function (cb, config) {
        if (config === void 0) { config = {}; }
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (!currentAccount) {
                return requireAuth(function () { return cb.apply(void 0, args); });
            }
            if (needsEmailVerification) {
                Keyboard.dismiss();
                closeAll();
                emailDialogControl.open(__assign({ id: EmailDialogScreenID.Verify }, config));
                return undefined;
            }
            else {
                return cb.apply(void 0, args);
            }
        };
    }, [
        needsEmailVerification,
        currentAccount,
        emailDialogControl,
        closeAll,
        requireAuth,
    ]);
}
