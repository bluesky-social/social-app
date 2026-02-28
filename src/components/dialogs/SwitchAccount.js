var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useAccountSwitcher } from '#/lib/hooks/useAccountSwitcher';
import { useSession } from '#/state/session';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { atoms as a } from '#/alf';
import * as Dialog from '#/components/Dialog';
import { AccountList } from '../AccountList';
import { Text } from '../Typography';
export function SwitchAccountDialog(_a) {
    var control = _a.control;
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var _b = useAccountSwitcher(), onPressSwitchAccount = _b.onPressSwitchAccount, pendingDid = _b.pendingDid;
    var setShowLoggedOut = useLoggedOutViewControls().setShowLoggedOut;
    var onSelectAccount = useCallback(function (account) {
        if (account.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
            control.close(function () {
                onPressSwitchAccount(account, 'SwitchAccount');
            });
        }
        else {
            control.close();
        }
    }, [currentAccount, control, onPressSwitchAccount]);
    var onPressAddAccount = useCallback(function () {
        control.close(function () {
            setShowLoggedOut(true);
        });
    }, [setShowLoggedOut, control]);
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Switch account"], ["Switch account"])))), children: [_jsxs(View, { style: [a.gap_lg], children: [_jsx(Text, { style: [a.text_2xl, a.font_semi_bold], children: _jsx(Trans, { children: "Switch account" }) }), _jsx(AccountList, { onSelectAccount: onSelectAccount, onSelectOther: onPressAddAccount, otherLabel: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Add account"], ["Add account"])))), pendingDid: pendingDid })] }), _jsx(Dialog.Close, {})] })] }));
}
var templateObject_1, templateObject_2;
