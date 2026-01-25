var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import ReactNativeDeviceAttest from 'react-native-device-attest';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { nanoid } from 'nanoid/non-secure';
import { createFullHandle } from '#/lib/strings/handles';
import { logger } from '#/logger';
import { useSignupContext } from '#/screens/Signup/state';
import { CaptchaWebView } from '#/screens/Signup/StepCaptcha/CaptchaWebView';
import { atoms as a, useTheme } from '#/alf';
import { FormError } from '#/components/forms/FormError';
import { useAnalytics } from '#/analytics';
import { GCP_PROJECT_ID, IS_ANDROID, IS_IOS, IS_NATIVE, IS_WEB } from '#/env';
import { BackNextButtons } from '../BackNextButtons';
var CAPTCHA_PATH = IS_WEB || GCP_PROJECT_ID === 0
    ? '/gate/signup'
    : '/gate/signup/attempt-attest';
export function StepCaptcha() {
    if (IS_WEB) {
        return _jsx(StepCaptchaInner, {});
    }
    else {
        return _jsx(StepCaptchaNative, {});
    }
}
export function StepCaptchaNative() {
    var _this = this;
    var _a = useState(), token = _a[0], setToken = _a[1];
    var _b = useState(), payload = _b[0], setPayload = _b[1];
    var _c = useState(false), ready = _c[0], setReady = _c[1];
    useEffect(function () {
        ;
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var token_1, _a, token_2, payload_1, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logger.debug('trying to generate attestation token...');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, 7, 8]);
                        if (!IS_IOS) return [3 /*break*/, 3];
                        logger.debug('starting to generate devicecheck token...');
                        return [4 /*yield*/, ReactNativeDeviceAttest.getDeviceCheckToken()];
                    case 2:
                        token_1 = _b.sent();
                        setToken(token_1);
                        logger.debug("generated devicecheck token: ".concat(token_1));
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, ReactNativeDeviceAttest.getIntegrityToken('signup')];
                    case 4:
                        _a = _b.sent(), token_2 = _a.token, payload_1 = _a.payload;
                        setToken(token_2);
                        setPayload(base64UrlEncode(payload_1));
                        _b.label = 5;
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_1 = _b.sent();
                        logger.error(e_1);
                        return [3 /*break*/, 8];
                    case 7:
                        setReady(true);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        }); })();
    }, []);
    if (!ready) {
        return _jsx(View, {});
    }
    return _jsx(StepCaptchaInner, { token: token, payload: payload });
}
function StepCaptchaInner(_a) {
    var token = _a.token, payload = _a.payload;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var theme = useTheme();
    var _b = useSignupContext(), state = _b.state, dispatch = _b.dispatch;
    var _c = React.useState(false), completed = _c[0], setCompleted = _c[1];
    var stateParam = React.useMemo(function () { return nanoid(15); }, []);
    var url = React.useMemo(function () {
        var newUrl = new URL(state.serviceUrl);
        newUrl.pathname = CAPTCHA_PATH;
        newUrl.searchParams.set('handle', createFullHandle(state.handle, state.userDomain));
        newUrl.searchParams.set('state', stateParam);
        newUrl.searchParams.set('colorScheme', theme.name);
        if (IS_NATIVE && token) {
            newUrl.searchParams.set('platform', Platform.OS);
            newUrl.searchParams.set('token', token);
            if (IS_ANDROID && payload) {
                newUrl.searchParams.set('payload', payload);
            }
        }
        return newUrl.href;
    }, [
        state.serviceUrl,
        state.handle,
        state.userDomain,
        stateParam,
        theme.name,
        token,
        payload,
    ]);
    var onSuccess = React.useCallback(function (code) {
        setCompleted(true);
        ax.metric('signup:captchaSuccess', {});
        dispatch({
            type: 'submit',
            task: { verificationCode: code, mutableProcessed: false },
        });
    }, [ax, dispatch]);
    var onError = React.useCallback(function (error) {
        dispatch({
            type: 'setError',
            value: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Error receiving captcha response."], ["Error receiving captcha response."])))),
        });
        ax.metric('signup:captchaFailure', {});
        logger.error('Signup Flow Error', {
            registrationHandle: state.handle,
            error: error,
        });
    }, [_, ax, dispatch, state.handle]);
    var onBackPress = React.useCallback(function () {
        logger.error('Signup Flow Error', {
            errorMessage: 'User went back from captcha step. Possibly encountered an error.',
            registrationHandle: state.handle,
        });
        dispatch({ type: 'prev' });
    }, [dispatch, state.handle]);
    return (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.gap_lg, a.pt_lg], children: [_jsx(View, { style: [
                            a.w_full,
                            a.overflow_hidden,
                            { minHeight: 510 },
                            completed && [a.align_center, a.justify_center],
                        ], children: !completed ? (_jsx(CaptchaWebView, { url: url, stateParam: stateParam, state: state, onComplete: function () { return setCompleted(true); }, onSuccess: onSuccess, onError: onError })) : (_jsx(ActivityIndicator, { size: "large" })) }), _jsx(FormError, { error: state.error })] }), _jsx(BackNextButtons, { hideNext: true, isLoading: state.isLoading, onBackPress: onBackPress })] }));
}
function base64UrlEncode(data) {
    var encoder = new TextEncoder();
    var bytes = encoder.encode(data);
    var binaryString = String.fromCharCode.apply(String, bytes);
    var base64 = btoa(binaryString);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]/g, '');
}
var templateObject_1;
