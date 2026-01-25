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
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition, } from 'react-native-reanimated';
import { msg, Plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { createFullHandle, MAX_SERVICE_HANDLE_LENGTH, validateServiceHandle, } from '#/lib/strings/handles';
import { logger } from '#/logger';
import { checkHandleAvailability, useHandleAvailabilityQuery, } from '#/state/queries/handle-availability';
import { useSignupContext } from '#/screens/Signup/state';
import { atoms as a, native, useTheme } from '#/alf';
import * as TextField from '#/components/forms/TextField';
import { useThrottledValue } from '#/components/hooks/useThrottledValue';
import { At_Stroke2_Corner0_Rounded as AtIcon } from '#/components/icons/At';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { BackNextButtons } from '../BackNextButtons';
import { HandleSuggestions } from './HandleSuggestions';
export function StepHandle() {
    var _this = this;
    var _a, _b;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var t = useTheme();
    var _c = useSignupContext(), state = _c.state, dispatch = _c.dispatch;
    var _d = useState(state.handle), draftValue = _d[0], setDraftValue = _d[1];
    var isNextLoading = useThrottledValue(state.isLoading, 500);
    var validCheck = validateServiceHandle(draftValue, state.userDomain);
    var _e = useHandleAvailabilityQuery({
        username: draftValue,
        serviceDid: (_b = (_a = state.serviceDescription) === null || _a === void 0 ? void 0 : _a.did) !== null && _b !== void 0 ? _b : 'UNKNOWN',
        serviceDomain: state.userDomain,
        birthDate: state.dateOfBirth.toISOString(),
        email: state.email,
        enabled: validCheck.overall,
    }), debouncedDraftValue = _e.debouncedUsername, queryEnabled = _e.enabled, _f = _e.query, isHandleAvailable = _f.data, isPending = _f.isPending;
    var onNextPress = function () { return __awaiter(_this, void 0, void 0, function () {
        var handle, handleAvailable, error_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    handle = draftValue.trim();
                    dispatch({
                        type: 'setHandle',
                        value: handle,
                    });
                    if (!validCheck.overall) {
                        return [2 /*return*/];
                    }
                    dispatch({ type: 'setIsLoading', value: true });
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, checkHandleAvailability(createFullHandle(handle, state.userDomain), (_b = (_a = state.serviceDescription) === null || _a === void 0 ? void 0 : _a.did) !== null && _b !== void 0 ? _b : 'UNKNOWN', {})];
                case 2:
                    handleAvailable = (_e.sent()).available;
                    if (!handleAvailable) {
                        ax.metric('signup:handleTaken', { typeahead: false });
                        dispatch({
                            type: 'setError',
                            value: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["That username is already taken"], ["That username is already taken"])))),
                            field: 'handle',
                        });
                        return [2 /*return*/];
                    }
                    else {
                        ax.metric('signup:handleAvailable', { typeahead: false });
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _e.sent();
                    logger.error('Failed to check handle availability on next press', {
                        safeMessage: error_1,
                    });
                    return [3 /*break*/, 5];
                case 4:
                    dispatch({ type: 'setIsLoading', value: false });
                    return [7 /*endfinally*/];
                case 5:
                    ax.metric('signup:nextPressed', {
                        activeStep: state.activeStep,
                        phoneVerificationRequired: (_c = state.serviceDescription) === null || _c === void 0 ? void 0 : _c.phoneVerificationRequired,
                    });
                    // phoneVerificationRequired is actually whether a captcha is required
                    if (!((_d = state.serviceDescription) === null || _d === void 0 ? void 0 : _d.phoneVerificationRequired)) {
                        dispatch({
                            type: 'submit',
                            task: { verificationCode: undefined, mutableProcessed: false },
                        });
                        return [2 /*return*/];
                    }
                    dispatch({ type: 'next' });
                    return [2 /*return*/];
            }
        });
    }); };
    var onBackPress = function () {
        var handle = draftValue.trim();
        dispatch({
            type: 'setHandle',
            value: handle,
        });
        dispatch({ type: 'prev' });
        ax.metric('signup:backPressed', { activeStep: state.activeStep });
    };
    var hasDebounceSettled = draftValue === debouncedDraftValue;
    var isHandleTaken = !isPending &&
        queryEnabled &&
        isHandleAvailable &&
        !isHandleAvailable.available;
    var isNotReady = isPending || !hasDebounceSettled;
    var isNextDisabled = !validCheck.overall || !!state.error || isNotReady ? true : isHandleTaken;
    var textFieldInvalid = isHandleTaken ||
        !validCheck.frontLengthNotTooLong ||
        !validCheck.handleChars ||
        !validCheck.hyphenStartOrEnd ||
        !validCheck.totalLength;
    return (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.gap_sm, a.pt_lg, a.z_10], children: [_jsx(View, { children: _jsxs(TextField.Root, { isInvalid: textFieldInvalid, children: [_jsx(TextField.Icon, { icon: AtIcon }), _jsx(TextField.Input, { testID: "handleInput", onChangeText: function (val) {
                                        if (state.error) {
                                            dispatch({ type: 'setError', value: '' });
                                        }
                                        setDraftValue(val.toLocaleLowerCase());
                                    }, label: state.userDomain, value: draftValue, keyboardType: "ascii-capable" // fix for iOS replacing -- with —
                                    , autoCapitalize: "none", autoCorrect: false, autoFocus: true, autoComplete: "off" }), draftValue.length > 0 && (_jsx(TextField.GhostText, { value: state.userDomain, children: draftValue })), (isHandleAvailable === null || isHandleAvailable === void 0 ? void 0 : isHandleAvailable.available) && (_jsx(CheckIcon, { testID: "handleAvailableCheck", style: [{ color: t.palette.positive_500 }, a.z_20] }))] }) }), _jsx(LayoutAnimationConfig, { skipEntering: true, skipExiting: true, children: _jsxs(View, { style: [a.gap_xs], children: [state.error && (_jsx(Requirement, { children: _jsx(RequirementText, { children: state.error }) })), isHandleTaken && validCheck.overall && (_jsxs(_Fragment, { children: [_jsx(Requirement, { children: _jsx(RequirementText, { children: _jsxs(Trans, { children: [createFullHandle(draftValue, state.userDomain), " is not available"] }) }) }), isHandleAvailable.suggestions &&
                                            isHandleAvailable.suggestions.length > 0 && (_jsx(HandleSuggestions, { suggestions: isHandleAvailable.suggestions, onSelect: function (suggestion) {
                                                setDraftValue(suggestion.handle.slice(0, state.userDomain.length * -1));
                                                ax.metric('signup:handleSuggestionSelected', {
                                                    method: suggestion.method,
                                                });
                                            } }))] })), (!validCheck.handleChars || !validCheck.hyphenStartOrEnd) && (_jsx(Requirement, { children: !validCheck.hyphenStartOrEnd ? (_jsx(RequirementText, { children: _jsx(Trans, { children: "Username cannot begin or end with a hyphen" }) })) : (_jsx(RequirementText, { children: _jsx(Trans, { children: "Username must only contain letters (a-z), numbers, and hyphens" }) })) })), _jsx(Requirement, { children: (!validCheck.frontLengthNotTooLong ||
                                        !validCheck.totalLength) && (_jsx(RequirementText, { children: _jsxs(Trans, { children: ["Username cannot be longer than", ' ', _jsx(Plural, { value: MAX_SERVICE_HANDLE_LENGTH, other: "# characters" })] }) })) })] }) })] }), _jsx(Animated.View, { layout: native(LinearTransition), children: _jsx(BackNextButtons, { isLoading: isNextLoading, isNextDisabled: isNextDisabled, onBackPress: onBackPress, onNextPress: onNextPress }) })] }));
}
function Requirement(_a) {
    var children = _a.children;
    return (_jsx(Animated.View, { style: [a.w_full], layout: native(LinearTransition), entering: native(FadeIn), exiting: native(FadeOut), children: children }));
}
function RequirementText(_a) {
    var children = _a.children;
    var t = useTheme();
    return (_jsx(Text, { style: [a.text_sm, a.flex_1, { color: t.palette.negative_500 }], children: children }));
}
var templateObject_1;
