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
import { Platform, View } from 'react-native';
import { Image } from 'expo-image';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { until } from '#/lib/async/until';
import { isNetworkError } from '#/lib/strings/errors';
import { RQKEY } from '#/state/queries/profile';
import { useAgent, useSession } from '#/state/session';
import { atoms as a, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { CustomLinkWarningDialog } from '#/components/dialogs/LinkWarning';
import { ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon } from '#/components/icons/Arrow';
import { Link } from '#/components/Link';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
export function GermButton(_a) {
    var _b;
    var germ = _a.germ, profile = _a.profile;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var linkWarningControl = Dialog.useDialogControl();
    // exclude `none` and all unknown values
    if (!(germ.showButtonTo === 'everyone' || germ.showButtonTo === 'usersIFollow')) {
        return null;
    }
    if ((currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === profile.did) {
        return _jsx(GermSelfButton, { did: currentAccount.did });
    }
    if (germ.showButtonTo === 'usersIFollow' && !((_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.followedBy)) {
        return null;
    }
    var url = constructGermUrl(germ, profile, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    if (!url) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsxs(Link, { to: url, onPress: function (evt) {
                    ax.metric('profile:associated:germ:click-to-chat', {});
                    if (isCustomGermDomain(url)) {
                        evt.preventDefault();
                        linkWarningControl.open();
                        return false;
                    }
                }, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Open Germ DM"], ["Open Germ DM"])))), overridePresentation: false, shouldProxy: false, style: [
                    t.atoms.bg_contrast_50,
                    a.rounded_full,
                    a.self_start,
                    { padding: 6 },
                ], children: [_jsx(GermLogo, { size: "small" }), _jsx(Text, { style: [a.text_sm, a.font_medium, a.ml_xs], children: _jsx(Trans, { children: "Germ DM" }) }), _jsx(ArrowTopRightIcon, { style: [t.atoms.text, a.mx_2xs], width: 14 })] }), _jsx(CustomLinkWarningDialog, { control: linkWarningControl, link: {
                    href: url,
                    displayText: '',
                    share: false,
                } })] }));
}
function GermLogo(_a) {
    var size = _a.size;
    return (_jsx(Image, { source: require('../../../../assets/images/germ_logo.webp'), accessibilityIgnoresInvertColors: false, contentFit: "cover", style: [
            a.rounded_full,
            size === 'large' ? { width: 32, height: 32 } : { width: 16, height: 16 },
        ] }));
}
function GermSelfButton(_a) {
    var _this = this;
    var did = _a.did;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var selfExplanationDialogControl = Dialog.useDialogControl();
    var agent = useAgent();
    var queryClient = useQueryClient();
    var _b = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var previousRecord;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.com.germnetwork.declaration
                            .get({
                            repo: did,
                            rkey: 'self',
                        })
                            .then(function (res) { return res.value; })
                            .catch(function () { return null; })];
                    case 1:
                        previousRecord = _a.sent();
                        return [4 /*yield*/, agent.com.germnetwork.declaration.delete({
                                repo: did,
                                rkey: 'self',
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, whenAppViewReady(agent, did, function (res) { var _a; return !((_a = res.data.associated) === null || _a === void 0 ? void 0 : _a.germ); })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, previousRecord];
                }
            });
        }); },
        onSuccess: function (previousRecord) {
            ax.metric('profile:associated:germ:self-disconnect', {});
            function undo() {
                return __awaiter(this, void 0, void 0, function () {
                    var e_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!previousRecord)
                                    return [2 /*return*/];
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 5, , 6]);
                                return [4 /*yield*/, agent.com.germnetwork.declaration.put({
                                        repo: did,
                                        rkey: 'self',
                                    }, previousRecord)];
                            case 2:
                                _a.sent();
                                return [4 /*yield*/, whenAppViewReady(agent, did, function (res) { var _a; return !!((_a = res.data.associated) === null || _a === void 0 ? void 0 : _a.germ); })];
                            case 3:
                                _a.sent();
                                return [4 /*yield*/, queryClient.refetchQueries({ queryKey: RQKEY(did) })];
                            case 4:
                                _a.sent();
                                Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Germ DM reconnected"], ["Germ DM reconnected"])))));
                                ax.metric('profile:associated:germ:self-reconnect', {});
                                return [3 /*break*/, 6];
                            case 5:
                                e_1 = _a.sent();
                                Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Failed to reconnect Germ DM. Error: ", ""], ["Failed to reconnect Germ DM. Error: ", ""])), e_1 === null || e_1 === void 0 ? void 0 : e_1.message)), {
                                    type: 'error',
                                });
                                if (!isNetworkError(e_1)) {
                                    ax.logger.error('Failed to reconnect Germ DM link', {
                                        safeMessage: e_1,
                                    });
                                }
                                return [3 /*break*/, 6];
                            case 6: return [2 /*return*/];
                        }
                    });
                });
            }
            selfExplanationDialogControl.close(function () {
                void queryClient.refetchQueries({ queryKey: RQKEY(did) });
                Toast.show(_jsxs(Toast.Outer, { children: [_jsx(Toast.Icon, {}), _jsx(Toast.Text, { children: _jsx(Trans, { children: "Germ DM disconnected" }) }), previousRecord && (_jsx(Toast.Action, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Undo"], ["Undo"])))), onPress: function () { return void undo(); }, children: _jsx(Trans, { children: "Undo" }) }))] }));
            });
        },
        onError: function (error) {
            Toast.show(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Failed to disconnect Germ DM. Error: ", ""], ["Failed to disconnect Germ DM. Error: ", ""])), error === null || error === void 0 ? void 0 : error.message)), {
                type: 'error',
            });
            if (!isNetworkError(error)) {
                ax.logger.error('Failed to disconnect Germ DM link', {
                    safeMessage: error,
                });
            }
        },
    }), deleteDeclaration = _b.mutate, isPending = _b.isPending;
    return (_jsxs(_Fragment, { children: [_jsxs(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Learn more about your Germ DM link"], ["Learn more about your Germ DM link"])))), onPress: function () {
                    ax.metric('profile:associated:germ:click-self-info', {});
                    selfExplanationDialogControl.open();
                }, style: [
                    t.atoms.bg_contrast_50,
                    a.rounded_full,
                    a.self_start,
                    { padding: 6, paddingRight: 10 },
                ], children: [_jsx(GermLogo, { size: "small" }), _jsx(Text, { style: [a.text_sm, a.font_medium, a.ml_xs], children: _jsx(Trans, { children: "Germ DM" }) })] }), _jsxs(Dialog.Outer, { control: selfExplanationDialogControl, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Germ DM Link"], ["Germ DM Link"])))), style: web([{ maxWidth: 400, borderRadius: 36 }]), children: [_jsxs(View, { style: [a.flex_row, a.align_center, { gap: 6 }], children: [_jsx(GermLogo, { size: "large" }), _jsx(Text, { style: [a.text_2xl, a.font_bold], children: _jsx(Trans, { children: "Germ DM Link" }) })] }), _jsx(Text, { style: [a.text_md, a.leading_snug, a.mt_sm], children: _jsx(Trans, { children: "This button lets others open the Germ DM app to send you a message. You can manage its visibility from the Germ DM app, or you can disconnect your Bluesky account from Germ DM altogether by clicking the button below." }) }), _jsxs(View, { style: [a.mt_2xl, a.gap_md], children: [_jsx(Button, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Got it"], ["Got it"])))), size: "large", color: "primary", onPress: function () { return selfExplanationDialogControl.close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Got it" }) }) }), _jsxs(Button, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Disconnect Germ DM"], ["Disconnect Germ DM"])))), size: "large", color: "secondary", onPress: function () { return deleteDeclaration(); }, disabled: isPending, children: [isPending && _jsx(ButtonIcon, { icon: Loader }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Disconnect Germ DM" }) })] })] })] })] })] }));
}
function constructGermUrl(declaration, profile, viewerDid) {
    try {
        var urlp = new URL(declaration.messageMeUrl);
        if (urlp.pathname.endsWith('/')) {
            urlp.pathname = urlp.pathname.slice(0, -1);
        }
        urlp.pathname += "/".concat(platform());
        if (viewerDid) {
            urlp.hash = "#".concat(profile.did, "+").concat(viewerDid);
        }
        else {
            urlp.hash = "#".concat(profile.did);
        }
        return urlp.toString();
    }
    catch (_a) {
        return null;
    }
}
function isCustomGermDomain(url) {
    try {
        var urlp = new URL(url);
        return urlp.hostname !== 'landing.ger.mx';
    }
    catch (_a) {
        return false;
    }
}
function platform() {
    switch (Platform.OS) {
        case 'ios':
            return 'iOS';
        case 'android':
            return 'android';
        default:
            return 'web';
    }
}
function whenAppViewReady(agent, actor, fn) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, until(5, // 5 tries
                    1e3, // 1s delay between tries
                    fn, function () { return agent.app.bsky.actor.getProfile({ actor: actor }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
