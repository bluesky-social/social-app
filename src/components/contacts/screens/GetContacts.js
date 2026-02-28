var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { useContext } from 'react';
import { Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import { AppBskyContactImportContacts, } from '@atproto/api';
import { msg, t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadBlob } from '#/lib/api';
import { cleanError, isNetworkError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { findContactsStatusQueryKey } from '#/state/queries/find-contacts';
import { useAgent } from '#/state/session';
import { Context as OnboardingContext, } from '#/screens/Onboarding/state';
import { atoms as a, ios, tokens, useGutters } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Layout from '#/components/Layout';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { contactsWithPhoneNumbersOnly, filterMatchedNumbers, getMatchedContacts, normalizeContactBook, } from '../contacts';
import { constructFullPhoneNumber } from '../phone-number';
var MAX_UPLOAD_COUNT = 1000;
export function GetContacts(_a) {
    var _this = this;
    var state = _a.state, dispatch = _a.dispatch, onCancel = _a.onCancel, context = _a.context;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var agent = useAgent();
    var insets = useSafeAreaInsets();
    var gutters = useGutters([0, 'wide']);
    var queryClient = useQueryClient();
    var maybeOnboardingContext = useContext(OnboardingContext);
    var _b = useMutation({
        mutationFn: function (contacts) { return __awaiter(_this, void 0, void 0, function () {
            var error_1, _a, phoneNumbers, indexToContactId, res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(context === 'Onboarding' && maybeOnboardingContext)) return [3 /*break*/, 4];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, createProfileRecord(agent, maybeOnboardingContext)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _b.sent();
                        logger.debug('Error creating profile record:', { safeMessage: error_1 });
                        return [3 /*break*/, 4];
                    case 4:
                        _a = normalizeContactBook(contacts, state.phoneCountryCode, constructFullPhoneNumber(state.phoneCountryCode, state.phoneNumber)), phoneNumbers = _a.phoneNumbers, indexToContactId = _a.indexToContactId;
                        if (!(phoneNumbers.length > 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, agent.app.bsky.contact.importContacts({
                                token: state.token,
                                contacts: phoneNumbers.slice(0, MAX_UPLOAD_COUNT),
                            })];
                    case 5:
                        res = _b.sent();
                        return [2 /*return*/, {
                                matches: res.data.matchesAndContactIndexes,
                                indexToContactId: indexToContactId,
                            }];
                    case 6: return [2 /*return*/, {
                            matches: [],
                            indexToContactId: indexToContactId,
                        }];
                }
            });
        }); },
        onSuccess: function (result, contacts) {
            if (context === 'Onboarding') {
                ax.metric('onboarding:contacts:contactsShared', {});
            }
            if (result.matches.length > 0) {
                ax.metric('contacts:import:success', {
                    contactCount: contacts.length,
                    matchCount: result.matches.length,
                    entryPoint: context,
                });
            }
            else {
                ax.metric('contacts:import:failure', {
                    reason: 'noValidNumbers',
                    entryPoint: context,
                });
            }
            dispatch({
                type: 'SYNC_CONTACTS_SUCCESS',
                payload: {
                    matches: getMatchedContacts(contacts, result.matches, result.indexToContactId),
                    contacts: filterMatchedNumbers(contacts, result.matches, result.indexToContactId),
                },
            });
            queryClient.invalidateQueries({
                queryKey: findContactsStatusQueryKey,
            });
        },
        onError: function (err) {
            ax.metric('contacts:import:failure', {
                reason: isNetworkError(err) ? 'networkError' : 'unknown',
                entryPoint: context,
            });
            if (isNetworkError(err)) {
                Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["There was a problem with your internet connection, please try again"], ["There was a problem with your internet connection, please try again"])))), { type: 'error' });
            }
            else if (err instanceof AppBskyContactImportContacts.TooManyContactsError) {
                Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Too many contacts - you've exceeded the number of contacts you can import to find your friends"], ["Too many contacts - you've exceeded the number of contacts you can import to find your friends"])))), { type: 'error' });
            }
            else if (err instanceof AppBskyContactImportContacts.InvalidTokenError) {
                Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Could not upload contacts. You need to re-verify your phone number to proceed"], ["Could not upload contacts. You need to re-verify your phone number to proceed"])))), { type: 'error' });
            }
            else {
                logger.error('Error uploading contacts', { safeMessage: err });
                Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Could not upload contacts. ", ""], ["Could not upload contacts. ", ""])), cleanError(err))), {
                    type: 'error',
                });
            }
        },
    }), uploadContacts = _b.mutate, isUploadPending = _b.isPending;
    var _c = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var permissions, contacts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Contacts.getPermissionsAsync()];
                    case 1:
                        permissions = _a.sent();
                        if (!(!permissions.granted && permissions.canAskAgain)) return [3 /*break*/, 3];
                        return [4 /*yield*/, Contacts.requestPermissionsAsync()];
                    case 2:
                        permissions = _a.sent();
                        _a.label = 3;
                    case 3:
                        ax.metric('contacts:permission:request', {
                            status: permissions.granted ? 'granted' : 'denied',
                            accessLevelIOS: ios(permissions.accessPrivileges),
                        });
                        if (!permissions.granted) {
                            throw new PermissionDeniedError();
                        }
                        return [4 /*yield*/, Contacts.getContactsAsync({
                                fields: [
                                    Contacts.Fields.FirstName,
                                    Contacts.Fields.LastName,
                                    Contacts.Fields.PhoneNumbers,
                                    Contacts.Fields.Image,
                                ],
                            })];
                    case 4:
                        contacts = _a.sent();
                        return [2 /*return*/, contactsWithPhoneNumbersOnly(contacts.data)];
                }
            });
        }); },
        onSuccess: function (contacts) {
            dispatch({
                type: 'GET_CONTACTS_SUCCESS',
                payload: { contacts: contacts },
            });
            uploadContacts(contacts);
        },
        onError: function (err) {
            if (err instanceof PermissionDeniedError) {
                showPermissionDeniedAlert();
            }
            else {
                logger.error('Error getting contacts', { safeMessage: err });
            }
        },
    }), getContacts = _c.mutate, isGetContactsPending = _c.isPending;
    var isPending = isUploadPending || isGetContactsPending;
    var style = [a.text_md, a.leading_snug, a.mt_md];
    return (_jsxs(View, { style: [a.h_full], children: [_jsxs(Layout.Content, { contentContainerStyle: [gutters, a.flex_1, a.pt_xl], bounces: false, children: [_jsx(Text, { style: [a.font_bold, a.text_3xl], children: _jsx(Trans, { children: "Share your contacts to find friends" }) }), _jsx(Text, { style: style, children: _jsx(Trans, { children: "Bluesky helps friends find each other by creating an encoded digital fingerprint, called a \"hash\", and then looking for matching hashes." }) }), _jsxs(Text, { style: style, children: ["\u2022 ", _jsx(Trans, { children: "We never keep plain phone numbers" })] }), _jsxs(Text, { style: style, children: ["\u2022 ", _jsx(Trans, { children: "We delete hashes after matches are made" })] }), _jsxs(Text, { style: style, children: ["\u2022 ", _jsx(Trans, { children: "We only suggest follows if both people consent" })] }), _jsxs(Text, { style: style, children: ["\u2022 ", _jsx(Trans, { children: "You can always opt out and delete your data" })] }), _jsx(Text, { style: [style, a.mt_lg], children: _jsx(Trans, { children: "We apply the highest privacy standards, and never share or sell your contact information." }) })] }), _jsxs(View, { style: [
                    gutters,
                    a.pt_xs,
                    { paddingBottom: Math.max(insets.bottom, tokens.space.xl) },
                    a.gap_md,
                ], children: [_jsx(Text, { style: [a.text_sm, a.pb_xs], children: _jsx(Trans, { children: "I consent to Bluesky using my contacts for mutual friend discovery and to retain hashed data for matching until I opt out." }) }), _jsx(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Find my friends"], ["Find my friends"])))), size: "large", color: "primary", onPress: function () { return getContacts(); }, disabled: isPending, children: isUploadPending ? (_jsxs(_Fragment, { children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Finding friends..." }) }), _jsx(ButtonIcon, { icon: Loader })] })) : (_jsx(ButtonText, { children: _jsx(Trans, { children: "Find my friends" }) })) }), _jsx(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Cancel"], ["Cancel"])))), size: "large", color: "secondary", onPress: onCancel, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) })] })] }));
}
var PermissionDeniedError = /** @class */ (function (_super) {
    __extends(PermissionDeniedError, _super);
    function PermissionDeniedError() {
        return _super.call(this, 'Permission denied') || this;
    }
    return PermissionDeniedError;
}(Error));
function showPermissionDeniedAlert() {
    Alert.alert(t(templateObject_7 || (templateObject_7 = __makeTemplateObject(["You've denied access to your contacts"], ["You've denied access to your contacts"]))), t(templateObject_8 || (templateObject_8 = __makeTemplateObject(["You'll need to go to the System Settings for Bluesky and give permission if you want to use this feature."], ["You'll need to go to the System Settings for Bluesky and give permission if you want to use this feature."]))), [
        {
            text: t(templateObject_9 || (templateObject_9 = __makeTemplateObject(["OK"], ["OK"]))),
            style: 'default',
        },
    ]);
}
/**
 * Copied from `#/screens/Onboarding/StepFinished/index.tsx`
 */
function createProfileRecord(agent, onboardingContext) {
    return __awaiter(this, void 0, void 0, function () {
        var profileStepResults, imageUri, imageMime, blobPromise;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    profileStepResults = onboardingContext.state.profileStepResults;
                    imageUri = profileStepResults.imageUri, imageMime = profileStepResults.imageMime;
                    blobPromise = imageUri && imageMime ? uploadBlob(agent, imageUri, imageMime) : undefined;
                    return [4 /*yield*/, agent.upsertProfile(function (existing) { return __awaiter(_this, void 0, void 0, function () {
                            var next, res;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        next = existing !== null && existing !== void 0 ? existing : {};
                                        if (!blobPromise) return [3 /*break*/, 2];
                                        return [4 /*yield*/, blobPromise];
                                    case 1:
                                        res = _a.sent();
                                        if (res.data.blob) {
                                            next.avatar = res.data.blob;
                                        }
                                        _a.label = 2;
                                    case 2:
                                        next.displayName = '';
                                        next.createdAt = new Date().toISOString();
                                        return [2 /*return*/, next];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
