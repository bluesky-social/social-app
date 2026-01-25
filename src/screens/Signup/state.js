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
import React, { useCallback } from 'react';
import { LayoutAnimation } from 'react-native';
import { ComAtprotoServerCreateAccount, } from '@atproto/api';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import * as EmailValidator from 'email-validator';
import { DEFAULT_SERVICE } from '#/lib/constants';
import { cleanError } from '#/lib/strings/errors';
import { createFullHandle } from '#/lib/strings/handles';
import { getAge } from '#/lib/strings/time';
import { useSessionApi } from '#/state/session';
import { useOnboardingDispatch } from '#/state/shell';
import { useAnalytics } from '#/analytics';
var DEFAULT_DATE = new Date(Date.now() - 60e3 * 60 * 24 * 365 * 20); // default to 20 years ago
export var SignupStep;
(function (SignupStep) {
    SignupStep[SignupStep["INFO"] = 0] = "INFO";
    SignupStep[SignupStep["HANDLE"] = 1] = "HANDLE";
    SignupStep[SignupStep["CAPTCHA"] = 2] = "CAPTCHA";
})(SignupStep || (SignupStep = {}));
export var initialState = {
    analytics: undefined,
    hasPrev: false,
    activeStep: SignupStep.INFO,
    screenTransitionDirection: 'Forward',
    serviceUrl: DEFAULT_SERVICE,
    serviceDescription: undefined,
    userDomain: '',
    dateOfBirth: DEFAULT_DATE,
    email: '',
    password: '',
    handle: '',
    inviteCode: '',
    error: '',
    errorField: undefined,
    isLoading: false,
    pendingSubmit: null,
    // Tracking
    signupStartTime: Date.now(),
    fieldErrors: {
        'invite-code': 0,
        email: 0,
        handle: 0,
        password: 0,
        'date-of-birth': 0,
    },
    backgroundCount: 0,
};
export function is13(date) {
    return getAge(date) >= 13;
}
export function is18(date) {
    return getAge(date) >= 18;
}
export function reducer(s, a) {
    var _a, _b, _c, _d, _e, _f;
    var next = __assign({}, s);
    switch (a.type) {
        case 'setAnalytics': {
            next.analytics = a.value;
            break;
        }
        case 'prev': {
            if (s.activeStep !== SignupStep.INFO) {
                next.screenTransitionDirection = 'Backward';
                next.activeStep--;
                next.error = '';
                next.errorField = undefined;
            }
            break;
        }
        case 'next': {
            if (s.activeStep !== SignupStep.CAPTCHA) {
                next.screenTransitionDirection = 'Forward';
                next.activeStep++;
                next.error = '';
                next.errorField = undefined;
            }
            break;
        }
        case 'setStep': {
            next.activeStep = a.value;
            break;
        }
        case 'setServiceUrl': {
            next.serviceUrl = a.value;
            break;
        }
        case 'setServiceDescription': {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            next.serviceDescription = a.value;
            next.userDomain = (_b = (_a = a.value) === null || _a === void 0 ? void 0 : _a.availableUserDomains[0]) !== null && _b !== void 0 ? _b : '';
            next.isLoading = false;
            break;
        }
        case 'setEmail': {
            next.email = a.value;
            break;
        }
        case 'setPassword': {
            next.password = a.value;
            break;
        }
        case 'setDateOfBirth': {
            next.dateOfBirth = a.value;
            break;
        }
        case 'setInviteCode': {
            next.inviteCode = a.value;
            break;
        }
        case 'setHandle': {
            next.handle = a.value;
            break;
        }
        case 'setIsLoading': {
            next.isLoading = a.value;
            break;
        }
        case 'setError': {
            next.error = a.value;
            next.errorField = a.field;
            // Track field errors
            if (a.field) {
                next.fieldErrors[a.field] = (next.fieldErrors[a.field] || 0) + 1;
                // Log the field error
                (_c = s.analytics) === null || _c === void 0 ? void 0 : _c.metric('signup:fieldError', {
                    field: a.field,
                    errorCount: next.fieldErrors[a.field],
                    errorMessage: a.value,
                    activeStep: next.activeStep,
                });
            }
            break;
        }
        case 'clearError': {
            next.error = '';
            next.errorField = undefined;
            break;
        }
        case 'submit': {
            next.pendingSubmit = a.task;
            break;
        }
        case 'incrementBackgroundCount': {
            next.backgroundCount = s.backgroundCount + 1;
            // Log background/foreground event during signup
            (_d = s.analytics) === null || _d === void 0 ? void 0 : _d.metric('signup:backgrounded', {
                activeStep: next.activeStep,
                backgroundCount: next.backgroundCount,
            });
            break;
        }
    }
    next.hasPrev = next.activeStep !== SignupStep.INFO;
    (_e = s.analytics) === null || _e === void 0 ? void 0 : _e.logger.debug('signup', next);
    if (s.activeStep !== next.activeStep) {
        (_f = s.analytics) === null || _f === void 0 ? void 0 : _f.logger.debug('signup: step changed', {
            activeStep: next.activeStep,
        });
    }
    return next;
}
export var SignupContext = React.createContext({});
SignupContext.displayName = 'SignupContext';
export var useSignupContext = function () { return React.useContext(SignupContext); };
export function useSubmitSignup() {
    var _this = this;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var createAccount = useSessionApi().createAccount;
    var onboardingDispatch = useOnboardingDispatch();
    return useCallback(function (state, dispatch) { return __awaiter(_this, void 0, void 0, function () {
        var e_1, errMsg, error, isHandleError;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!state.email) {
                        dispatch({ type: 'setStep', value: SignupStep.INFO });
                        return [2 /*return*/, dispatch({
                                type: 'setError',
                                value: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Please enter your email."], ["Please enter your email."])))),
                                field: 'email',
                            })];
                    }
                    if (!EmailValidator.validate(state.email)) {
                        dispatch({ type: 'setStep', value: SignupStep.INFO });
                        return [2 /*return*/, dispatch({
                                type: 'setError',
                                value: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Your email appears to be invalid."], ["Your email appears to be invalid."])))),
                                field: 'email',
                            })];
                    }
                    if (!state.password) {
                        dispatch({ type: 'setStep', value: SignupStep.INFO });
                        return [2 /*return*/, dispatch({
                                type: 'setError',
                                value: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Please choose your password."], ["Please choose your password."])))),
                                field: 'password',
                            })];
                    }
                    if (!state.handle) {
                        dispatch({ type: 'setStep', value: SignupStep.HANDLE });
                        return [2 /*return*/, dispatch({
                                type: 'setError',
                                value: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Please choose your handle."], ["Please choose your handle."])))),
                                field: 'handle',
                            })];
                    }
                    if (((_a = state.serviceDescription) === null || _a === void 0 ? void 0 : _a.phoneVerificationRequired) &&
                        !((_b = state.pendingSubmit) === null || _b === void 0 ? void 0 : _b.verificationCode)) {
                        dispatch({ type: 'setStep', value: SignupStep.CAPTCHA });
                        ax.logger.error('Signup Flow Error', {
                            errorMessage: 'Verification captcha code was not set.',
                            registrationHandle: state.handle,
                        });
                        return [2 /*return*/, dispatch({
                                type: 'setError',
                                value: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Please complete the verification captcha."], ["Please complete the verification captcha."])))),
                            })];
                    }
                    dispatch({ type: 'setError', value: '' });
                    dispatch({ type: 'setIsLoading', value: true });
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, createAccount({
                            service: state.serviceUrl,
                            email: state.email,
                            handle: createFullHandle(state.handle, state.userDomain),
                            password: state.password,
                            birthDate: state.dateOfBirth,
                            inviteCode: state.inviteCode.trim(),
                            verificationCode: (_c = state.pendingSubmit) === null || _c === void 0 ? void 0 : _c.verificationCode,
                        }, {
                            signupDuration: Date.now() - state.signupStartTime,
                            fieldErrorsTotal: Object.values(state.fieldErrors).reduce(function (a, b) { return a + b; }, 0),
                            backgroundCount: state.backgroundCount,
                        })
                        /*
                         * Must happen last so that if the user has multiple tabs open and
                         * createAccount fails, one tab is not stuck in onboarding — Eric
                         */
                    ];
                case 2:
                    _d.sent();
                    /*
                     * Must happen last so that if the user has multiple tabs open and
                     * createAccount fails, one tab is not stuck in onboarding — Eric
                     */
                    onboardingDispatch({ type: 'start' });
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _d.sent();
                    errMsg = e_1.toString();
                    if (e_1 instanceof ComAtprotoServerCreateAccount.InvalidInviteCodeError) {
                        dispatch({
                            type: 'setError',
                            value: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Invite code not accepted. Check that you input it correctly and try again."], ["Invite code not accepted. Check that you input it correctly and try again."])))),
                            field: 'invite-code',
                        });
                        dispatch({ type: 'setStep', value: SignupStep.INFO });
                        return [2 /*return*/];
                    }
                    error = cleanError(errMsg);
                    isHandleError = error.toLowerCase().includes('handle');
                    dispatch({ type: 'setIsLoading', value: false });
                    dispatch({
                        type: 'setError',
                        value: error,
                        field: isHandleError ? 'handle' : undefined,
                    });
                    dispatch({ type: 'setStep', value: isHandleError ? 2 : 1 });
                    ax.logger.error('Signup Flow Error', {
                        errorMessage: error,
                        registrationHandle: state.handle,
                    });
                    return [3 /*break*/, 5];
                case 4:
                    dispatch({ type: 'setIsLoading', value: false });
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [_, onboardingDispatch, createAccount]);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
