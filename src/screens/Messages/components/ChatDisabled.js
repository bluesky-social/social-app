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
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { ToolsOzoneReportDefs } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useMutation } from '@tanstack/react-query';
import { BLUESKY_MOD_SERVICE_HEADERS } from '#/lib/constants';
import { logger } from '#/logger';
import { useAgent, useSession } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
export function ChatDisabled() {
    var t = useTheme();
    return (_jsx(View, { style: [a.p_md], children: _jsxs(View, { style: [a.align_start, a.p_xl, a.rounded_md, t.atoms.bg_contrast_25], children: [_jsx(Text, { style: [
                        a.text_md,
                        a.font_semi_bold,
                        a.pb_sm,
                        t.atoms.text_contrast_high,
                    ], children: _jsx(Trans, { children: "Your chats have been disabled" }) }), _jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Our moderators have reviewed reports and decided to disable your access to chats on Bluesky." }) }), _jsx(AppealDialog, {})] }) }));
}
function AppealDialog() {
    var control = Dialog.useDialogControl();
    var _ = useLingui()._;
    return (_jsxs(_Fragment, { children: [_jsx(Button, { testID: "appealDisabledChatBtn", variant: "ghost", color: "secondary", size: "small", onPress: control.open, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Appeal this decision"], ["Appeal this decision"])))), style: a.mt_sm, children: _jsx(ButtonText, { children: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Appeal this decision"], ["Appeal this decision"])))) }) }), _jsxs(Dialog.Outer, { control: control, children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, {})] })] }));
}
function DialogInner() {
    var _this = this;
    var _ = useLingui()._;
    var control = Dialog.useDialogContext();
    var _a = useState(''), details = _a[0], setDetails = _a[1];
    var gtMobile = useBreakpoints().gtMobile;
    var agent = useAgent();
    var currentAccount = useSession().currentAccount;
    var _b = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!currentAccount)
                            throw new Error('No current account, should be unreachable');
                        return [4 /*yield*/, agent.createModerationReport({
                                reasonType: ToolsOzoneReportDefs.REASONAPPEAL,
                                subject: {
                                    $type: 'com.atproto.admin.defs#repoRef',
                                    did: currentAccount.did,
                                },
                                reason: details,
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
        onError: function (err) {
            logger.error('Failed to submit chat appeal', { message: err });
            Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Failed to submit appeal, please try again."], ["Failed to submit appeal, please try again."])))), 'xmark');
        },
        onSuccess: function () {
            control.close();
            Toast.show(_(msg({ message: 'Appeal submitted', context: 'toast' })));
        },
    }), mutate = _b.mutate, isPending = _b.isPending;
    var onSubmit = useCallback(function () { return mutate(); }, [mutate]);
    var onBack = useCallback(function () { return control.close(); }, [control]);
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Appeal this decision"], ["Appeal this decision"])))), children: [_jsx(Text, { style: [a.text_2xl, a.font_semi_bold, a.pb_xs, a.leading_tight], children: _jsx(Trans, { children: "Appeal this decision" }) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsx(Trans, { children: "This appeal will be sent to Bluesky's moderation service." }) }), _jsx(View, { style: [a.my_md], children: _jsx(Dialog.Input, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Text input field"], ["Text input field"])))), placeholder: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Please explain why you think your chats were incorrectly disabled"], ["Please explain why you think your chats were incorrectly disabled"])))), value: details, onChangeText: setDetails, autoFocus: true, numberOfLines: 3, multiline: true, maxLength: 300 }) }), _jsxs(View, { style: gtMobile
                    ? [a.flex_row, a.justify_between]
                    : [{ flexDirection: 'column-reverse' }, a.gap_sm], children: [_jsx(Button, { testID: "backBtn", variant: "solid", color: "secondary", size: "large", onPress: onBack, label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Back"], ["Back"])))), children: _jsx(ButtonText, { children: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Back"], ["Back"])))) }) }), _jsxs(Button, { testID: "submitBtn", variant: "solid", color: "primary", size: "large", onPress: onSubmit, label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Submit"], ["Submit"])))), children: [_jsx(ButtonText, { children: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Submit"], ["Submit"])))) }), isPending && _jsx(ButtonIcon, { icon: Loader })] })] }), _jsx(Dialog.Close, {})] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;
