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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { ToolsOzoneReportDefs } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useMutation } from '@tanstack/react-query';
import { BLUESKY_MOD_SERVICE_HEADERS } from '#/lib/constants';
import { useAgent, useSession } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useBreakpoints, web } from '#/alf';
import { AgeAssuranceBadge } from '#/components/ageAssurance/AgeAssuranceBadge';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { logger } from '#/ageAssurance';
import { useAnalytics } from '#/analytics';
export function AgeAssuranceAppealDialog(_a) {
    var control = _a.control;
    var _ = useLingui()._;
    return (_jsxs(Dialog.Outer, { control: control, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Contact our moderation team"], ["Contact our moderation team"])))), style: [web({ maxWidth: 400 })], children: [_jsx(Inner, { control: control }), _jsx(Dialog.Close, {})] })] }));
}
function Inner(_a) {
    var _this = this;
    var control = _a.control;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var gtPhone = useBreakpoints().gtPhone;
    var agent = useAgent();
    var _b = React.useState(''), details = _b[0], setDetails = _b[1];
    var isInvalid = details.length > 1000;
    var _c = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ax.metric('ageAssurance:appealDialogSubmit', {});
                        return [4 /*yield*/, agent.createModerationReport({
                                reasonType: ToolsOzoneReportDefs.REASONAPPEAL,
                                subject: {
                                    $type: 'com.atproto.admin.defs#repoRef',
                                    did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did,
                                },
                                reason: "AGE_ASSURANCE_INQUIRY: " + details,
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
            logger.error('AgeAssuranceAppealDialog failed', { safeMessage: err });
            Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Age assurance inquiry failed to send, please try again."], ["Age assurance inquiry failed to send, please try again."])))), 'xmark');
        },
        onSuccess: function () {
            control.close();
            Toast.show(_(msg({
                message: 'Age assurance inquiry was submitted',
                context: 'toast',
            })));
        },
    }), mutate = _c.mutate, isPending = _c.isPending;
    return (_jsxs(View, { children: [_jsx(View, { style: [a.align_start], children: _jsx(AgeAssuranceBadge, {}) }), _jsx(Text, { style: [a.text_2xl, a.font_bold, a.pt_md, a.leading_tight], children: _jsx(Trans, { children: "Contact us" }) }), _jsx(Text, { style: [a.text_sm, a.pt_sm, a.leading_snug], children: _jsx(Trans, { children: "Please provide any additional details you feel moderators may need in order to properly assess your Age Assurance status." }) }), _jsxs(View, { style: [a.pt_md], children: [_jsx(Dialog.Input, { multiline: true, isInvalid: isInvalid, value: details, onChangeText: function (details) {
                            setDetails(details);
                        }, label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Additional details (limit 1000 characters)"], ["Additional details (limit 1000 characters)"])))), numberOfLines: 4, onSubmitEditing: function () { return mutate(); } }), _jsxs(View, { style: [a.pt_md, a.gap_sm, gtPhone && [a.flex_row_reverse]], children: [_jsxs(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Submit"], ["Submit"])))), size: "small", variant: "solid", color: "primary", onPress: function () { return mutate(); }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Submit" }) }), isPending && _jsx(ButtonIcon, { icon: Loader, position: "right" })] }), _jsx(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Cancel"], ["Cancel"])))), size: "small", variant: "solid", color: "secondary", onPress: function () { return control.close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) })] })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
