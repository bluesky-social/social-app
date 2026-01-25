var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import Animated, { FadeIn, LayoutAnimationConfig } from 'react-native-reanimated';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { DEFAULT_SERVICE } from '#/lib/constants';
import { logger } from '#/logger';
import { useServiceQuery } from '#/state/queries/service';
import { useSession } from '#/state/session';
import { useLoggedOutView } from '#/state/shell/logged-out';
import { LoggedOutLayout } from '#/view/com/util/layouts/LoggedOutLayout';
import { ForgotPasswordForm } from '#/screens/Login/ForgotPasswordForm';
import { LoginForm } from '#/screens/Login/LoginForm';
import { PasswordUpdatedForm } from '#/screens/Login/PasswordUpdatedForm';
import { SetNewPasswordForm } from '#/screens/Login/SetNewPasswordForm';
import { atoms as a, native } from '#/alf';
import { ScreenTransition } from '#/components/ScreenTransition';
import { useAnalytics } from '#/analytics';
import { ChooseAccountForm } from './ChooseAccountForm';
var Forms;
(function (Forms) {
    Forms[Forms["Login"] = 0] = "Login";
    Forms[Forms["ChooseAccount"] = 1] = "ChooseAccount";
    Forms[Forms["ForgotPassword"] = 2] = "ForgotPassword";
    Forms[Forms["SetNewPassword"] = 3] = "SetNewPassword";
    Forms[Forms["PasswordUpdated"] = 4] = "PasswordUpdated";
})(Forms || (Forms = {}));
var OrderedForms = [
    Forms.ChooseAccount,
    Forms.Login,
    Forms.ForgotPassword,
    Forms.SetNewPassword,
    Forms.PasswordUpdated,
];
export var Login = function (_a) {
    var onPressBack = _a.onPressBack;
    var _ = useLingui()._;
    var failedAttemptCountRef = useRef(0);
    var startTimeRef = useRef(Date.now());
    var accounts = useSession().accounts;
    var requestedAccountSwitchTo = useLoggedOutView().requestedAccountSwitchTo;
    var requestedAccount = accounts.find(function (acc) { return acc.did === requestedAccountSwitchTo; });
    var _b = useState(''), error = _b[0], setError = _b[1];
    var _c = useState((requestedAccount === null || requestedAccount === void 0 ? void 0 : requestedAccount.service) || DEFAULT_SERVICE), serviceUrl = _c[0], setServiceUrl = _c[1];
    var _d = useState((requestedAccount === null || requestedAccount === void 0 ? void 0 : requestedAccount.handle) || ''), initialHandle = _d[0], setInitialHandle = _d[1];
    var _e = useState(requestedAccount
        ? Forms.Login
        : accounts.length
            ? Forms.ChooseAccount
            : Forms.Login), currentForm = _e[0], setCurrentForm = _e[1];
    var _f = useState('Forward'), screenTransitionDirection = _f[0], setScreenTransitionDirection = _f[1];
    var ax = useAnalytics();
    var _g = useServiceQuery(serviceUrl), serviceDescription = _g.data, serviceError = _g.error, refetchService = _g.refetch;
    var onSelectAccount = function (account) {
        if (account === null || account === void 0 ? void 0 : account.service) {
            setServiceUrl(account.service);
        }
        setInitialHandle((account === null || account === void 0 ? void 0 : account.handle) || '');
        gotoForm(Forms.Login);
    };
    var gotoForm = function (form) {
        setError('');
        var index = OrderedForms.indexOf(currentForm);
        var nextIndex = OrderedForms.indexOf(form);
        setScreenTransitionDirection(index < nextIndex ? 'Forward' : 'Backward');
        setCurrentForm(form);
    };
    useEffect(function () {
        if (serviceError) {
            setError(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Unable to contact your service. Please check your Internet connection."], ["Unable to contact your service. Please check your Internet connection."])))));
            logger.warn("Failed to fetch service description for ".concat(serviceUrl), {
                error: String(serviceError),
            });
            ax.metric('signin:hostingProviderFailedResolution', {});
        }
        else {
            setError('');
        }
    }, [serviceError, serviceUrl, _]);
    var onPressForgotPassword = function () {
        gotoForm(Forms.ForgotPassword);
        ax.metric('signin:forgotPasswordPressed', {});
    };
    var handlePressBack = function () {
        onPressBack();
        setScreenTransitionDirection('Backward');
        ax.metric('signin:backPressed', {
            failedAttemptsCount: failedAttemptCountRef.current,
        });
    };
    var onAttemptSuccess = function () {
        ax.metric('signin:success', {
            isUsingCustomProvider: serviceUrl !== DEFAULT_SERVICE,
            timeTakenSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
            failedAttemptsCount: failedAttemptCountRef.current,
        });
    };
    var onAttemptFailed = function () {
        failedAttemptCountRef.current += 1;
    };
    var content = null;
    var title = '';
    var description = '';
    switch (currentForm) {
        case Forms.Login:
            title = _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Sign in"], ["Sign in"]))));
            description = _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Enter your username and password"], ["Enter your username and password"]))));
            content = (_jsx(LoginForm, { error: error, serviceUrl: serviceUrl, serviceDescription: serviceDescription, initialHandle: initialHandle, setError: setError, onAttemptFailed: onAttemptFailed, onAttemptSuccess: onAttemptSuccess, setServiceUrl: setServiceUrl, onPressBack: function () {
                    return accounts.length ? gotoForm(Forms.ChooseAccount) : handlePressBack();
                }, onPressForgotPassword: onPressForgotPassword, onPressRetryConnect: refetchService }));
            break;
        case Forms.ChooseAccount:
            title = _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Sign in"], ["Sign in"]))));
            description = _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Select from an existing account"], ["Select from an existing account"]))));
            content = (_jsx(ChooseAccountForm, { onSelectAccount: onSelectAccount, onPressBack: handlePressBack }));
            break;
        case Forms.ForgotPassword:
            title = _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Forgot Password"], ["Forgot Password"]))));
            description = _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Let's get your password reset!"], ["Let's get your password reset!"]))));
            content = (_jsx(ForgotPasswordForm, { error: error, serviceUrl: serviceUrl, serviceDescription: serviceDescription, setError: setError, setServiceUrl: setServiceUrl, onPressBack: function () { return gotoForm(Forms.Login); }, onEmailSent: function () { return gotoForm(Forms.SetNewPassword); } }));
            break;
        case Forms.SetNewPassword:
            title = _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Forgot Password"], ["Forgot Password"]))));
            description = _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Let's get your password reset!"], ["Let's get your password reset!"]))));
            content = (_jsx(SetNewPasswordForm, { error: error, serviceUrl: serviceUrl, setError: setError, onPressBack: function () { return gotoForm(Forms.ForgotPassword); }, onPasswordSet: function () { return gotoForm(Forms.PasswordUpdated); } }));
            break;
        case Forms.PasswordUpdated:
            title = _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Password updated"], ["Password updated"]))));
            description = _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["You can now sign in with your new password."], ["You can now sign in with your new password."]))));
            content = (_jsx(PasswordUpdatedForm, { onPressNext: function () { return gotoForm(Forms.Login); } }));
            break;
    }
    return (_jsx(Animated.View, { style: a.flex_1, entering: native(FadeIn.duration(90)), children: _jsx(KeyboardAvoidingView, { testID: "signIn", behavior: "padding", style: a.flex_1, children: _jsx(LoggedOutLayout, { leadin: "", title: title, description: description, scrollable: true, children: _jsx(LayoutAnimationConfig, { skipEntering: true, children: _jsx(ScreenTransition, { direction: screenTransitionDirection, children: content }, currentForm) }) }) }) }));
};
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11;
