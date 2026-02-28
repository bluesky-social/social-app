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
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { logger } from '#/logger';
import { useAgent, useSessionApi } from '#/state/session';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Divider } from '#/components/Divider';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { Loader } from '#/components/Loader';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';
export function DeactivateAccountDialog(_a) {
    var control = _a.control;
    return (_jsx(Prompt.Outer, { control: control, children: _jsx(DeactivateAccountDialogInner, { control: control }) }));
}
function DeactivateAccountDialogInner(_a) {
    var _this = this;
    var control = _a.control;
    var t = useTheme();
    var _ = useLingui()._;
    var agent = useAgent();
    var logoutCurrentAccount = useSessionApi().logoutCurrentAccount;
    var _b = React.useState(false), pending = _b[0], setPending = _b[1];
    var _c = React.useState(), error = _c[0], setError = _c[1];
    var handleDeactivate = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setPending(true);
                    return [4 /*yield*/, agent.com.atproto.server.deactivateAccount({})];
                case 1:
                    _a.sent();
                    control.close(function () {
                        logoutCurrentAccount('Deactivated');
                    });
                    return [3 /*break*/, 4];
                case 2:
                    e_1 = _a.sent();
                    switch (e_1.message) {
                        case 'Bad token scope':
                            setError(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You're signed in with an App Password. Please sign in with your main password to continue deactivating your account."], ["You're signed in with an App Password. Please sign in with your main password to continue deactivating your account."])))));
                            break;
                        default:
                            setError(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Something went wrong, please try again"], ["Something went wrong, please try again"])))));
                            break;
                    }
                    logger.error(e_1, {
                        message: 'Failed to deactivate account',
                    });
                    return [3 /*break*/, 4];
                case 3:
                    setPending(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [agent, control, logoutCurrentAccount, _, setPending]);
    return (_jsxs(_Fragment, { children: [_jsx(Prompt.TitleText, { children: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Deactivate account"], ["Deactivate account"])))) }), _jsx(Prompt.DescriptionText, { children: _jsx(Trans, { children: "Your profile, posts, feeds, and lists will no longer be visible to other Bluesky users. You can reactivate your account at any time by logging in." }) }), _jsxs(View, { style: [a.pb_xl], children: [_jsx(Divider, {}), _jsxs(View, { style: [a.gap_sm, a.pt_lg, a.pb_xl], children: [_jsx(Text, { style: [t.atoms.text_contrast_medium, a.leading_snug], children: _jsx(Trans, { children: "There is no time limit for account deactivation, come back any time." }) }), _jsx(Text, { style: [t.atoms.text_contrast_medium, a.leading_snug], children: _jsx(Trans, { children: "If you're trying to change your handle or email, do so before you deactivate." }) })] }), _jsx(Divider, {})] }), _jsxs(Prompt.Actions, { children: [_jsxs(Button, { color: "negative", size: "large", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Yes, deactivate"], ["Yes, deactivate"])))), onPress: handleDeactivate, children: [_jsx(ButtonText, { children: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Yes, deactivate"], ["Yes, deactivate"])))) }), pending && _jsx(ButtonIcon, { icon: Loader, position: "right" })] }), _jsx(Prompt.Cancel, {})] }), error && (_jsxs(View, { style: [
                    a.flex_row,
                    a.gap_sm,
                    a.mt_md,
                    a.p_md,
                    a.rounded_sm,
                    t.atoms.bg_contrast_25,
                ], children: [_jsx(CircleInfo, { size: "md", fill: t.palette.negative_400 }), _jsx(Text, { style: [a.flex_1, a.leading_snug], children: error })] }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
