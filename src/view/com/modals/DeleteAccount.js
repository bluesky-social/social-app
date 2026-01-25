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
import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, TouchableOpacity, View, } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { DM_SERVICE_HEADERS } from '#/lib/constants';
import { usePalette } from '#/lib/hooks/usePalette';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { cleanError } from '#/lib/strings/errors';
import { colors, gradients, s } from '#/lib/styles';
import { useTheme } from '#/lib/ThemeContext';
import { useModalControls } from '#/state/modals';
import { useAgent, useSession, useSessionApi } from '#/state/session';
import { atoms as a, useTheme as useNewTheme } from '#/alf';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { Text as NewText } from '#/components/Typography';
import { IS_ANDROID, IS_WEB } from '#/env';
import { resetToTab } from '../../../Navigation';
import { ErrorMessage } from '../util/error/ErrorMessage';
import { Text } from '../util/text/Text';
import * as Toast from '../util/Toast';
import { ScrollView, TextInput } from './util';
export var snapPoints = IS_ANDROID ? ['90%'] : ['55%'];
export function Component(_a) {
    var _this = this;
    var pal = usePalette('default');
    var theme = useTheme();
    var t = useNewTheme();
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var removeAccount = useSessionApi().removeAccount;
    var _ = useLingui()._;
    var closeModal = useModalControls().closeModal;
    var isMobile = useWebMediaQueries().isMobile;
    var _b = React.useState(false), isEmailSent = _b[0], setIsEmailSent = _b[1];
    var _c = React.useState(''), confirmCode = _c[0], setConfirmCode = _c[1];
    var _d = React.useState(''), password = _d[0], setPassword = _d[1];
    var _e = React.useState(false), isProcessing = _e[0], setIsProcessing = _e[1];
    var _f = React.useState(''), error = _f[0], setError = _f[1];
    var onPressSendEmail = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setError('');
                    setIsProcessing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, agent.com.atproto.server.requestAccountDelete()];
                case 2:
                    _a.sent();
                    setIsEmailSent(true);
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    setError(cleanError(e_1));
                    return [3 /*break*/, 4];
                case 4:
                    setIsProcessing(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var onPressConfirmDelete = function () { return __awaiter(_this, void 0, void 0, function () {
        var token, success, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
                        throw new Error("DeleteAccount modal: currentAccount.did is undefined");
                    }
                    setError('');
                    setIsProcessing(true);
                    token = confirmCode.replace(/\s/g, '');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, agent.api.chat.bsky.actor.deleteAccount(undefined, {
                            headers: DM_SERVICE_HEADERS,
                        })];
                case 2:
                    success = (_a.sent()).success;
                    if (!success) {
                        throw new Error('Failed to inform chat service of account deletion');
                    }
                    return [4 /*yield*/, agent.com.atproto.server.deleteAccount({
                            did: currentAccount.did,
                            password: password,
                            token: token,
                        })];
                case 3:
                    _a.sent();
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Your account has been deleted"], ["Your account has been deleted"])))));
                    resetToTab('HomeTab');
                    removeAccount(currentAccount);
                    closeModal();
                    return [3 /*break*/, 5];
                case 4:
                    e_2 = _a.sent();
                    setError(cleanError(e_2));
                    return [3 /*break*/, 5];
                case 5:
                    setIsProcessing(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var onCancel = function () {
        closeModal();
    };
    return (_jsx(SafeAreaView, { style: [s.flex1], children: _jsxs(ScrollView, { style: [pal.view], keyboardShouldPersistTaps: "handled", children: [_jsx(View, { style: [styles.titleContainer, pal.view], children: _jsx(Text, { type: "title-xl", style: [s.textCenter, pal.text], children: _jsxs(Trans, { children: ["Delete Account", ' ', _jsx(Text, { type: "title-xl", style: [pal.text, s.bold], children: "\"" }), _jsx(Text, { type: "title-xl", numberOfLines: 1, style: [
                                        isMobile ? styles.titleMobile : styles.titleDesktop,
                                        pal.text,
                                        s.bold,
                                    ], children: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.handle }), _jsx(Text, { type: "title-xl", style: [pal.text, s.bold], children: "\"" })] }) }) }), !isEmailSent ? (_jsxs(_Fragment, { children: [_jsx(Text, { type: "lg", style: [styles.description, pal.text], children: _jsx(Trans, { children: "For security reasons, we'll need to send a confirmation code to your email address." }) }), error ? (_jsx(View, { style: s.mt10, children: _jsx(ErrorMessage, { message: error }) })) : undefined, isProcessing ? (_jsx(View, { style: [styles.btn, s.mt10], children: _jsx(ActivityIndicator, {}) })) : (_jsxs(_Fragment, { children: [_jsx(TouchableOpacity, { style: styles.mt20, onPress: onPressSendEmail, accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Send email"], ["Send email"])))), accessibilityHint: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Sends email with confirmation code for account deletion"], ["Sends email with confirmation code for account deletion"])))), children: _jsx(LinearGradient, { colors: [
                                            gradients.blueLight.start,
                                            gradients.blueLight.end,
                                        ], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, style: [styles.btn], children: _jsx(Text, { type: "button-lg", style: [s.white, s.bold], children: _jsx(Trans, { context: "action", children: "Send Email" }) }) }) }), _jsx(TouchableOpacity, { style: [styles.btn, s.mt10], onPress: onCancel, accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Cancel account deletion"], ["Cancel account deletion"])))), accessibilityHint: "", onAccessibilityEscape: onCancel, children: _jsx(Text, { type: "button-lg", style: pal.textLight, children: _jsx(Trans, { context: "action", children: "Cancel" }) }) })] })), _jsx(View, { style: [!IS_WEB && a.px_xl], children: _jsxs(View, { style: [
                                    a.w_full,
                                    a.flex_row,
                                    a.gap_sm,
                                    a.mt_lg,
                                    a.p_lg,
                                    a.rounded_sm,
                                    t.atoms.bg_contrast_25,
                                ], children: [_jsx(CircleInfo, { size: "md", style: [
                                            a.relative,
                                            {
                                                top: -1,
                                            },
                                        ] }), _jsx(NewText, { style: [a.leading_snug, a.flex_1], children: _jsx(Trans, { children: "You can also temporarily deactivate your account instead, and reactivate it at any time." }) })] }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { type: "lg", style: [pal.text, styles.description], nativeID: "confirmationCode", children: _jsx(Trans, { children: "Check your inbox for an email with the confirmation code to enter below:" }) }), _jsx(TextInput, { style: [styles.textInput, pal.borderDark, pal.text, styles.mb20], placeholder: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Confirmation code"], ["Confirmation code"])))), placeholderTextColor: pal.textLight.color, keyboardAppearance: theme.colorScheme, value: confirmCode, onChangeText: setConfirmCode, accessibilityLabelledBy: "confirmationCode", accessibilityLabel: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Confirmation code"], ["Confirmation code"])))), accessibilityHint: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Input confirmation code for account deletion"], ["Input confirmation code for account deletion"])))) }), _jsx(Text, { type: "lg", style: [pal.text, styles.description], nativeID: "password", children: _jsx(Trans, { children: "Please enter your password as well:" }) }), _jsx(TextInput, { style: [styles.textInput, pal.borderDark, pal.text], placeholder: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Password"], ["Password"])))), placeholderTextColor: pal.textLight.color, keyboardAppearance: theme.colorScheme, secureTextEntry: true, value: password, onChangeText: setPassword, accessibilityLabelledBy: "password", accessibilityLabel: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Password"], ["Password"])))), accessibilityHint: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Input password for account deletion"], ["Input password for account deletion"])))) }), error ? (_jsx(View, { style: styles.mt20, children: _jsx(ErrorMessage, { message: error }) })) : undefined, isProcessing ? (_jsx(View, { style: [styles.btn, s.mt10], children: _jsx(ActivityIndicator, {}) })) : (_jsxs(_Fragment, { children: [_jsx(TouchableOpacity, { style: [styles.btn, styles.evilBtn, styles.mt20], onPress: onPressConfirmDelete, accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Confirm delete account"], ["Confirm delete account"])))), accessibilityHint: "", children: _jsx(Text, { type: "button-lg", style: [s.white, s.bold], children: _jsx(Trans, { children: "Delete my account" }) }) }), _jsx(TouchableOpacity, { style: [styles.btn, s.mt10], onPress: onCancel, accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Cancel account deletion"], ["Cancel account deletion"])))), accessibilityHint: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Exits account deletion process"], ["Exits account deletion process"])))), onAccessibilityEscape: onCancel, children: _jsx(Text, { type: "button-lg", style: pal.textLight, children: _jsx(Trans, { context: "action", children: "Cancel" }) }) })] }))] }))] }) }));
}
var styles = StyleSheet.create({
    titleContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: 12,
        marginBottom: 12,
        marginLeft: 20,
        marginRight: 20,
    },
    titleMobile: {
        textAlign: 'center',
    },
    titleDesktop: {
        textAlign: 'center',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        // @ts-ignore only rendered on web
        maxWidth: '400px',
    },
    description: {
        textAlign: 'center',
        paddingHorizontal: 22,
        marginBottom: 10,
    },
    mt20: {
        marginTop: 20,
    },
    mb20: {
        marginBottom: 20,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 20,
        marginHorizontal: 20,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 32,
        padding: 14,
        marginHorizontal: 20,
    },
    evilBtn: {
        backgroundColor: colors.red4,
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13;
