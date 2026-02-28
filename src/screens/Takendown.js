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
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToolsOzoneReportDefs } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { countGraphemes } from 'unicode-segmenter/grapheme';
import { BLUESKY_MOD_SERVICE_HEADERS, MAX_REPORT_REASON_GRAPHEME_LENGTH, } from '#/lib/constants';
import { cleanError } from '#/lib/strings/errors';
import { useAgent, useSession, useSessionApi } from '#/state/session';
import { CharProgress } from '#/view/com/composer/char-progress/CharProgress';
import { Logo } from '#/view/icons/Logo';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as TextField from '#/components/forms/TextField';
import { SimpleInlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { P, Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
var COL_WIDTH = 400;
export function Takendown() {
    var _this = this;
    var _ = useLingui()._;
    var t = useTheme();
    var insets = useSafeAreaInsets();
    var gtMobile = useBreakpoints().gtMobile;
    var currentAccount = useSession().currentAccount;
    var logoutCurrentAccount = useSessionApi().logoutCurrentAccount;
    var agent = useAgent();
    var _a = useState(false), isAppealling = _a[0], setIsAppealling = _a[1];
    var _b = useState(''), reason = _b[0], setReason = _b[1];
    var reasonGraphemeLength = countGraphemes(reason);
    var isOverMaxLength = reasonGraphemeLength > MAX_REPORT_REASON_GRAPHEME_LENGTH;
    var _c = useMutation({
        mutationFn: function (appealText) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!currentAccount)
                            throw new Error('No session');
                        return [4 /*yield*/, agent.com.atproto.moderation.createReport({
                                reasonType: ToolsOzoneReportDefs.REASONAPPEAL,
                                subject: {
                                    $type: 'com.atproto.admin.defs#repoRef',
                                    did: currentAccount.did,
                                },
                                reason: appealText,
                            }, {
                                encoding: 'application/json',
                                headers: BLUESKY_MOD_SERVICE_HEADERS,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function () { return setReason(''); },
    }), submitAppeal = _c.mutate, isPending = _c.isPending, isSuccess = _c.isSuccess, error = _c.error;
    var primaryBtn = isAppealling && !isSuccess ? (_jsxs(Button, { color: "primary", size: "large", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Submit appeal"], ["Submit appeal"])))), onPress: function () { return submitAppeal(reason); }, disabled: isPending || isOverMaxLength, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Submit Appeal" }) }), isPending && _jsx(ButtonIcon, { icon: Loader })] })) : (_jsx(Button, { size: "large", color: "secondary_inverted", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Sign out"], ["Sign out"])))), onPress: function () { return logoutCurrentAccount('Takendown'); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Sign Out" }) }) }));
    var secondaryBtn = isAppealling ? (!isSuccess && (_jsx(Button, { variant: "ghost", size: "large", color: "secondary", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Cancel"], ["Cancel"])))), onPress: function () { return setIsAppealling(false); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) }))) : (_jsx(Button, { variant: "ghost", size: "large", color: "secondary", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Appeal suspension"], ["Appeal suspension"])))), onPress: function () { return setIsAppealling(true); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Appeal Suspension" }) }) }));
    var webLayout = IS_WEB && gtMobile;
    return (_jsxs(View, { style: [a.util_screen_outer, a.flex_1], children: [_jsx(KeyboardAwareScrollView, { style: [a.flex_1, t.atoms.bg], centerContent: true, children: _jsx(View, { style: [
                        a.flex_row,
                        a.justify_center,
                        gtMobile ? a.pt_4xl : [a.px_xl, a.pt_4xl],
                    ], children: _jsxs(View, { style: [a.flex_1, { maxWidth: COL_WIDTH, minHeight: COL_WIDTH }], children: [_jsx(View, { style: [a.pb_xl], children: _jsx(Logo, { width: 64 }) }), _jsx(Text, { style: [a.text_4xl, a.font_bold, a.pb_md], children: isAppealling ? (_jsx(Trans, { children: "Appeal suspension" })) : (_jsx(Trans, { children: "Your account has been suspended" })) }), isAppealling ? (_jsxs(View, { style: [a.relative, a.w_full, a.mt_xl], children: [isSuccess ? (_jsx(P, { style: [t.atoms.text_contrast_medium, a.text_center], children: _jsx(Trans, { children: "Your appeal has been submitted. If your appeal succeeds, you will receive an email." }) })) : (_jsxs(_Fragment, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Reason for appeal" }) }), _jsx(TextField.Root, { isInvalid: reasonGraphemeLength >
                                                    MAX_REPORT_REASON_GRAPHEME_LENGTH || !!error, children: _jsx(TextField.Input, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Reason for appeal"], ["Reason for appeal"])))), defaultValue: reason, onChangeText: setReason, placeholder: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Why are you appealing?"], ["Why are you appealing?"])))), multiline: true, numberOfLines: 5, autoFocus: true, style: { paddingBottom: 40, minHeight: 150 }, maxLength: MAX_REPORT_REASON_GRAPHEME_LENGTH * 10 }) }), _jsx(View, { style: [
                                                    a.absolute,
                                                    a.flex_row,
                                                    a.align_center,
                                                    a.pr_md,
                                                    a.pb_sm,
                                                    {
                                                        bottom: 0,
                                                        right: 0,
                                                    },
                                                ], children: _jsx(CharProgress, { count: reasonGraphemeLength, max: MAX_REPORT_REASON_GRAPHEME_LENGTH }) })] })), error && (_jsx(Text, { style: [
                                            a.text_md,
                                            a.leading_snug,
                                            { color: t.palette.negative_500 },
                                            a.mt_lg,
                                        ], children: cleanError(error) }))] })) : (_jsx(P, { style: [t.atoms.text_contrast_medium, a.leading_snug], children: _jsxs(Trans, { children: ["Your account was found to be in violation of the", ' ', _jsx(SimpleInlineLinkText, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Bluesky Social Terms of Service"], ["Bluesky Social Terms of Service"])))), to: "https://bsky.social/about/support/tos", style: [a.text_md, a.leading_snug], children: "Bluesky Social Terms of Service" }), ". You have been sent an email outlining the specific violation and suspension period, if applicable. You can appeal this decision if you believe it was made in error."] }) })), webLayout && (_jsxs(View, { style: [
                                    a.w_full,
                                    a.flex_row,
                                    a.justify_between,
                                    a.pt_5xl,
                                    { paddingBottom: 200 },
                                ], children: [secondaryBtn, primaryBtn] }))] }) }) }), !webLayout && (_jsx(View, { style: [
                    a.align_center,
                    t.atoms.bg,
                    gtMobile ? a.px_5xl : a.px_xl,
                    { paddingBottom: Math.max(insets.bottom, a.pb_5xl.paddingBottom) },
                ], children: _jsxs(View, { style: [a.w_full, a.gap_sm, { maxWidth: COL_WIDTH }], children: [primaryBtn, secondaryBtn] }) }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
