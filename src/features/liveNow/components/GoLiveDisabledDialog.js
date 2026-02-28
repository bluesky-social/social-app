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
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { ToolsOzoneReportDefs } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { BLUESKY_MOD_SERVICE_HEADERS } from '#/lib/constants';
import { logger } from '#/logger';
import { useAgent } from '#/state/session';
import { atoms as a, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
export function GoLiveDisabledDialog(_a) {
    var control = _a.control, status = _a.status;
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, { control: control, status: status })] }));
}
export function DialogInner(_a) {
    var _this = this;
    var control = _a.control, status = _a.status;
    var _ = useLingui()._;
    var agent = useAgent();
    var _b = useState(''), details = _b[0], setDetails = _b[1];
    var _c = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = agent.session) === null || _a === void 0 ? void 0 : _a.did)) {
                            throw new Error('Not logged in');
                        }
                        if (!status.uri || !status.cid) {
                            throw new Error('Status is missing uri or cid');
                        }
                        if (!__DEV__) return [3 /*break*/, 1];
                        logger.info('Submitting go live appeal', {
                            details: details,
                        });
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, agent.createModerationReport({
                            reasonType: ToolsOzoneReportDefs.REASONAPPEAL,
                            subject: {
                                $type: 'com.atproto.repo.strongRef',
                                uri: status.uri,
                                cid: status.cid,
                            },
                            reason: details,
                        }, {
                            encoding: 'application/json',
                            headers: BLUESKY_MOD_SERVICE_HEADERS,
                        })];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        onError: function () {
            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Failed to submit appeal, please try again."], ["Failed to submit appeal, please try again."])))), {
                type: 'error',
            });
        },
        onSuccess: function () {
            control.close();
            Toast.show(_(msg({ message: 'Appeal submitted', context: 'toast' })), {
                type: 'success',
            });
        },
    }), mutate = _c.mutate, isPending = _c.isPending;
    var onSubmit = useCallback(function () { return mutate(); }, [mutate]);
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Appeal livestream suspension"], ["Appeal livestream suspension"])))), style: [web({ maxWidth: 400 })], children: [_jsxs(View, { style: [a.gap_lg], children: [_jsxs(View, { style: [a.gap_md], children: [_jsx(Text, { style: [
                                    a.flex_1,
                                    a.text_2xl,
                                    a.font_semi_bold,
                                    a.leading_snug,
                                    a.pr_4xl,
                                ], children: _jsx(Trans, { children: "Going live is currently disabled for your account" }) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsx(Trans, { children: "You are currently blocked from using the Go Live feature. To appeal this moderation decision, please submit the form below." }) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsx(Trans, { children: "This appeal will be sent to Bluesky's moderation service." }) })] }), _jsxs(View, { style: [a.gap_md], children: [_jsx(Dialog.Input, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Text input field"], ["Text input field"])))), placeholder: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Please explain why you think your Go Live access was incorrectly disabled."], ["Please explain why you think your Go Live access was incorrectly disabled."])))), value: details, onChangeText: setDetails, autoFocus: true, numberOfLines: 3, multiline: true, maxLength: 300 }), _jsxs(Button, { testID: "submitBtn", variant: "solid", color: "primary", size: "large", onPress: onSubmit, label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Submit"], ["Submit"])))), children: [_jsx(ButtonText, { children: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Submit"], ["Submit"])))) }), isPending && _jsx(ButtonIcon, { icon: Loader })] })] })] }), _jsx(Dialog.Close, {})] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
