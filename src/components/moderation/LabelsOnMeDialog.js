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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { View } from 'react-native';
import { ToolsOzoneReportDefs } from '@atproto/api';
import { XRPCError } from '@atproto/xrpc';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { useGetTimeAgo } from '#/lib/hooks/useTimeAgo';
import { useLabelSubject } from '#/lib/moderation';
import { useLabelInfo } from '#/lib/moderation/useLabelInfo';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeHandle } from '#/lib/strings/handles';
import { logger } from '#/logger';
import { useAgent, useSession } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';
import { IS_ANDROID } from '#/env';
import { Admonition } from '../Admonition';
import { Divider } from '../Divider';
import { Loader } from '../Loader';
export { useDialogControl as useLabelsOnMeDialogControl } from '#/components/Dialog';
export function LabelsOnMeDialog(props) {
    return (_jsxs(Dialog.Outer, { control: props.control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(LabelsOnMeDialogInner, __assign({}, props))] }));
}
function LabelsOnMeDialogInner(props) {
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var _a = React.useState(undefined), appealingLabel = _a[0], setAppealingLabel = _a[1];
    var labels = props.labels;
    var isAccount = props.type === 'account';
    var containsSelfLabel = React.useMemo(function () { return labels.some(function (l) { return l.src === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did); }); }, [currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did, labels]);
    return (_jsxs(Dialog.ScrollableInner, { label: isAccount
            ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["The following labels were applied to your account."], ["The following labels were applied to your account."]))))
            : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["The following labels were applied to your content."], ["The following labels were applied to your content."])))), children: [appealingLabel ? (_jsx(AppealForm, { label: appealingLabel, control: props.control, onPressBack: function () { return setAppealingLabel(undefined); } })) : (_jsxs(_Fragment, { children: [_jsx(Text, { style: [a.text_2xl, a.font_bold, a.pb_xs, a.leading_tight], children: isAccount ? (_jsx(Trans, { children: "Labels on your account" })) : (_jsx(Trans, { children: "Labels on your content" })) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: containsSelfLabel ? (_jsx(Trans, { children: "You may appeal non-self labels if you feel they were placed in error." })) : (_jsx(Trans, { children: "You may appeal these labels if you feel they were placed in error." })) }), _jsx(View, { style: [a.py_lg, a.gap_md], children: labels.map(function (label) { return (_jsx(Label, { label: label, isSelfLabel: label.src === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did), control: props.control, onPressAppeal: setAppealingLabel }, "".concat(label.val, "-").concat(label.src))); }) })] })), _jsx(Dialog.Close, {})] }));
}
function Label(_a) {
    var label = _a.label, isSelfLabel = _a.isSelfLabel, control = _a.control, onPressAppeal = _a.onPressAppeal;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = useLabelInfo(label), labeler = _b.labeler, strings = _b.strings;
    var sourceName = labeler
        ? sanitizeHandle(labeler.creator.handle, '@')
        : label.src;
    var timeDiff = useGetTimeAgo({ future: true });
    return (_jsxs(View, { style: [
            a.border,
            t.atoms.border_contrast_low,
            a.rounded_sm,
            a.overflow_hidden,
        ], children: [_jsxs(View, { style: [a.p_md, a.gap_sm, a.flex_row], children: [_jsxs(View, { style: [a.flex_1, a.gap_xs], children: [_jsx(Text, { emoji: true, style: [a.font_semi_bold, a.text_md], children: strings.name }), _jsx(Text, { emoji: true, style: [t.atoms.text_contrast_medium, a.leading_snug], children: strings.description })] }), !isSelfLabel && (_jsx(View, { children: _jsx(Button, { variant: "solid", color: "secondary", size: "small", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Appeal"], ["Appeal"])))), onPress: function () { return onPressAppeal(label); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Appeal" }) }) }) }))] }), _jsx(Divider, {}), _jsx(View, { style: [a.px_md, a.py_sm, t.atoms.bg_contrast_25], children: isSelfLabel ? (_jsx(Text, { style: [t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "This label was applied by you." }) })) : (_jsxs(View, { style: [
                        a.flex_row,
                        a.justify_between,
                        a.gap_xl,
                        { paddingBottom: 1 },
                    ], children: [_jsx(Text, { style: [a.flex_1, a.leading_snug, t.atoms.text_contrast_medium], numberOfLines: 1, children: _jsxs(Trans, { children: ["Source:", ' ', _jsx(InlineLinkText, { label: sourceName, to: makeProfileLink(labeler ? labeler.creator : { did: label.src, handle: '' }), onPress: function () { return control.close(); }, children: sourceName })] }) }), label.exp && (_jsx(View, { children: _jsx(Text, { style: [
                                    a.leading_snug,
                                    a.text_sm,
                                    a.italic,
                                    t.atoms.text_contrast_medium,
                                ], children: _jsxs(Trans, { children: ["Expires in ", timeDiff(Date.now(), label.exp)] }) }) }))] })) })] }));
}
function AppealForm(_a) {
    var _this = this;
    var label = _a.label, control = _a.control, onPressBack = _a.onPressBack;
    var _ = useLingui()._;
    var _b = useLabelInfo(label), labeler = _b.labeler, strings = _b.strings;
    var gtMobile = useBreakpoints().gtMobile;
    var _c = React.useState(''), details = _c[0], setDetails = _c[1];
    var subject = useLabelSubject({ label: label }).subject;
    var isAccountReport = 'did' in subject;
    var agent = useAgent();
    var sourceName = labeler
        ? sanitizeHandle(labeler.creator.handle, '@')
        : label.src;
    var _d = useState(null), error = _d[0], setError = _d[1];
    var _e = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var $type;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        $type = !isAccountReport
                            ? 'com.atproto.repo.strongRef'
                            : 'com.atproto.admin.defs#repoRef';
                        return [4 /*yield*/, agent.createModerationReport({
                                reasonType: ToolsOzoneReportDefs.REASONAPPEAL,
                                subject: __assign({ $type: $type }, subject),
                                reason: details,
                            }, {
                                encoding: 'application/json',
                                headers: {
                                    'atproto-proxy': "".concat(label.src, "#atproto_labeler"),
                                },
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (err) {
            if (err instanceof XRPCError && err.error === 'AlreadyAppealed') {
                setError(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["You've already appealed this label and it's being reviewed by our moderation team."], ["You've already appealed this label and it's being reviewed by our moderation team."])))));
            }
            else {
                setError(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Failed to submit appeal, please try again."], ["Failed to submit appeal, please try again."])))));
            }
            logger.error('Failed to submit label appeal', { message: err });
        },
        onSuccess: function () {
            control.close();
            Toast.show(_(msg({ message: 'Appeal submitted', context: 'toast' })));
        },
    }), mutate = _e.mutate, isPending = _e.isPending;
    var onSubmit = React.useCallback(function () { return mutate(); }, [mutate]);
    return (_jsxs(_Fragment, { children: [_jsxs(View, { children: [_jsx(Text, { style: [a.text_2xl, a.font_semi_bold, a.pb_xs, a.leading_tight], children: _jsxs(Trans, { children: ["Appeal \"", strings.name, "\" label"] }) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsxs(Trans, { children: ["This appeal will be sent to", ' ', _jsx(InlineLinkText, { label: sourceName, to: makeProfileLink(labeler ? labeler.creator : { did: label.src, handle: '' }), onPress: function () { return control.close(); }, style: [a.text_md, a.leading_snug], children: sourceName }), "."] }) })] }), error && (_jsx(Admonition, { type: "error", style: [a.mt_sm], children: error })), _jsx(View, { style: [a.my_md], children: _jsx(Dialog.Input, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Text input field"], ["Text input field"])))), placeholder: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Please explain why you think this label was incorrectly applied by ", ""], ["Please explain why you think this label was incorrectly applied by ", ""])), labeler ? sanitizeHandle(labeler.creator.handle, '@') : label.src)), value: details, onChangeText: setDetails, autoFocus: true, numberOfLines: 3, multiline: true, maxLength: 300 }) }), _jsxs(View, { style: gtMobile
                    ? [a.flex_row, a.justify_between]
                    : [{ flexDirection: 'column-reverse' }, a.gap_sm], children: [_jsx(Button, { testID: "backBtn", variant: "solid", color: "secondary", size: "large", onPress: onPressBack, label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Back"], ["Back"])))), children: _jsx(ButtonText, { children: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Back"], ["Back"])))) }) }), _jsxs(Button, { testID: "submitBtn", variant: "solid", color: "primary", size: "large", onPress: onSubmit, label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Submit"], ["Submit"])))), children: [_jsx(ButtonText, { children: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Submit"], ["Submit"])))) }), isPending && _jsx(ButtonIcon, { icon: Loader })] })] }), IS_ANDROID && _jsx(View, { style: { height: 300 } })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11;
