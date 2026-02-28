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
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { useCloseAllActiveElements } from '#/state/util';
import { Logo } from '#/view/icons/Logo';
import { atoms as a } from '#/alf';
import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { Button, ButtonText } from '#/components/Button';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
var NavSignupCard = function (_a) {
    var _ = useLingui()._;
    var requestSwitchToAccount = useLoggedOutViewControls().requestSwitchToAccount;
    var closeAllActiveElements = useCloseAllActiveElements();
    var showSignIn = React.useCallback(function () {
        closeAllActiveElements();
        requestSwitchToAccount({ requestedAccount: 'none' });
    }, [requestSwitchToAccount, closeAllActiveElements]);
    var showCreateAccount = React.useCallback(function () {
        closeAllActiveElements();
        requestSwitchToAccount({ requestedAccount: 'new' });
        // setShowLoggedOut(true)
    }, [requestSwitchToAccount, closeAllActiveElements]);
    return (_jsxs(View, { style: [{ maxWidth: 245 }], children: [_jsx(Link, { to: "/", label: "Bluesky - Home", children: _jsx(Logo, { width: 32 }) }), _jsx(View, { style: [a.pt_lg], children: _jsx(Text, { style: [a.text_3xl, a.font_bold, { lineHeight: a.text_3xl.fontSize }], children: _jsx(Trans, { children: "Join the conversation" }) }) }), _jsxs(View, { style: [a.flex_row, a.flex_wrap, a.gap_sm, a.pt_md], children: [_jsx(Button, { onPress: showCreateAccount, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Create account"], ["Create account"])))), size: "small", variant: "solid", color: "primary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Create account" }) }) }), _jsx(Button, { onPress: showSignIn, label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Sign in"], ["Sign in"])))), size: "small", variant: "solid", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Sign in" }) }) })] }), _jsx(View, { style: [a.mt_md, a.w_full, { height: 32 }], children: _jsx(AppLanguageDropdown, {}) })] }));
};
NavSignupCard = React.memo(NavSignupCard);
export { NavSignupCard };
var templateObject_1, templateObject_2;
