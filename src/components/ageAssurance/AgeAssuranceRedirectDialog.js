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
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { retry } from '#/lib/async/retry';
import { wait } from '#/lib/async/wait';
import { useAgent } from '#/state/session';
import { atoms as a, useTheme, web } from '#/alf';
import { AgeAssuranceBadge } from '#/components/ageAssurance/AgeAssuranceBadge';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { CheckThick_Stroke2_Corner0_Rounded as SuccessIcon } from '#/components/icons/Check';
import { CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon } from '#/components/icons/CircleInfo';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { refetchAgeAssuranceServerState } from '#/ageAssurance';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
/**
 * Validate and parse the query parameters returned from the age assurance
 * redirect. If not valid, returns `undefined` and the dialog will not open.
 */
export function parseAgeAssuranceRedirectDialogState(state) {
    if (state === void 0) { state = {}; }
    var result = 'unknown';
    var actorDid = state.actorDid;
    switch (state.result) {
        case 'success':
            result = 'success';
            break;
        case 'unknown':
        default:
            result = 'unknown';
            break;
    }
    if (result && actorDid) {
        return {
            result: result,
            actorDid: actorDid,
        };
    }
}
export function useAgeAssuranceRedirectDialogControl() {
    return useGlobalDialogsControlContext().ageAssuranceRedirectDialogControl;
}
export function AgeAssuranceRedirectDialog() {
    var _ = useLingui()._;
    var control = useAgeAssuranceRedirectDialogControl();
    // for testing
    // Dialog.useAutoOpen(control.control, 3e3)
    return (_jsxs(Dialog.Outer, { control: control.control, onClose: function () { return control.clear(); }, children: [_jsx(Dialog.Handle, {}), _jsx(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Verifying your age assurance status"], ["Verifying your age assurance status"])))), style: [web({ maxWidth: 400 })], children: _jsx(Inner, { optimisticState: control.value }) })] }));
}
export function Inner(_a) {
    var _this = this;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var agent = useAgent();
    var polling = useRef(false);
    var unmounted = useRef(false);
    var control = useAgeAssuranceRedirectDialogControl();
    var _b = useState(false), error = _b[0], setError = _b[1];
    var _c = useState(false), success = _c[0], setSuccess = _c[1];
    useEffect(function () {
        if (polling.current)
            return;
        polling.current = true;
        ax.metric('ageAssurance:redirectDialogOpen', {});
        wait(3e3, retry(5, function () { return true; }, function () { return __awaiter(_this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!agent.session)
                            return [2 /*return*/];
                        if (unmounted.current)
                            return [2 /*return*/];
                        return [4 /*yield*/, refetchAgeAssuranceServerState({ agent: agent })];
                    case 1:
                        data = _a.sent();
                        if ((data === null || data === void 0 ? void 0 : data.state.status) !== 'assured') {
                            throw new Error("Polling for age assurance state did not receive assured status");
                        }
                        return [2 /*return*/, data];
                }
            });
        }); }, 1e3))
            .then(function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!data)
                    return [2 /*return*/];
                if (!agent.session)
                    return [2 /*return*/];
                if (unmounted.current)
                    return [2 /*return*/];
                setSuccess(true);
                ax.metric('ageAssurance:redirectDialogSuccess', {});
                return [2 /*return*/];
            });
        }); })
            .catch(function () {
            if (unmounted.current)
                return;
            setError(true);
            ax.metric('ageAssurance:redirectDialogFail', {});
        });
        return function () {
            unmounted.current = true;
        };
    }, [ax, agent, control]);
    if (success) {
        return (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.align_start, a.w_full], children: [_jsx(AgeAssuranceBadge, {}), _jsxs(View, { style: [
                                a.flex_row,
                                a.justify_between,
                                a.align_center,
                                a.gap_sm,
                                a.pt_lg,
                                a.pb_md,
                            ], children: [_jsx(SuccessIcon, { size: "sm", fill: t.palette.positive_500 }), _jsx(Text, { style: [a.text_xl, a.font_bold], children: _jsx(Trans, { children: "Success" }) })] }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsx(Trans, { children: "We've confirmed your age assurance status. You can now close this dialog." }) }), IS_NATIVE && (_jsx(View, { style: [a.w_full, a.pt_lg], children: _jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Close"], ["Close"])))), size: "large", variant: "solid", color: "secondary", onPress: function () { return control.control.close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) }) }))] }), _jsx(Dialog.Close, {})] }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.align_start, a.w_full], children: [_jsx(AgeAssuranceBadge, {}), _jsxs(View, { style: [
                            a.flex_row,
                            a.justify_between,
                            a.align_center,
                            a.gap_sm,
                            a.pt_lg,
                            a.pb_md,
                        ], children: [error && _jsx(ErrorIcon, { size: "md", fill: t.palette.negative_500 }), _jsx(Text, { style: [a.text_xl, a.font_bold], children: error ? _jsx(Trans, { children: "Connection issue" }) : _jsx(Trans, { children: "Verifying" }) }), !error && _jsx(Loader, { size: "md" })] }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: error ? (_jsx(Trans, { children: "We were unable to receive the verification due to a connection issue. It may arrive later. If it does, your account will update automatically." })) : (_jsx(Trans, { children: "We're confirming your age assurance status with our servers. This should only take a few seconds." })) }), error && IS_NATIVE && (_jsx(View, { style: [a.w_full, a.pt_lg], children: _jsx(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Close"], ["Close"])))), size: "large", variant: "solid", color: "secondary", onPress: function () { return control.control.close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) }) }))] }), error && _jsx(Dialog.Close, {})] }));
}
var templateObject_1, templateObject_2, templateObject_3;
