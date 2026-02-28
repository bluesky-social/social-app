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
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { logger } from '#/logger';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useVerificationCreateMutation } from '#/state/queries/verification/useVerificationCreateMutation';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useBreakpoints } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { VerifiedCheck } from '#/components/icons/VerifiedCheck';
import { Loader } from '#/components/Loader';
import * as ProfileCard from '#/components/ProfileCard';
import * as Prompt from '#/components/Prompt';
export function VerificationCreatePrompt(_a) {
    var _this = this;
    var control = _a.control, profile = _a.profile;
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var moderationOpts = useModerationOpts();
    var _b = useVerificationCreateMutation(), create = _b.mutateAsync, isPending = _b.isPending;
    var _c = useState(""), error = _c[0], setError = _c[1];
    var onConfirm = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, create({ profile: profile })];
                case 1:
                    _a.sent();
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Successfully verified"], ["Successfully verified"])))));
                    control.close();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    setError(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Verification failed, please try again."], ["Verification failed, please try again."])))));
                    logger.error('Failed to create a verification', {
                        safeMessage: e_1,
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, [_, profile, create, control]);
    return (_jsxs(Prompt.Outer, { control: control, children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_sm, a.pb_sm], children: [_jsx(VerifiedCheck, { width: 18 }), _jsx(Prompt.TitleText, { style: [a.pb_0], children: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Verify this account?"], ["Verify this account?"])))) })] }), _jsx(Prompt.DescriptionText, { children: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["This action can be undone at any time."], ["This action can be undone at any time."])))) }), moderationOpts ? (_jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts }), _jsx(ProfileCard.NameAndHandle, { profile: profile, moderationOpts: moderationOpts })] })) : null, error && (_jsx(View, { style: [a.pt_lg], children: _jsx(Admonition, { type: "error", children: error }) })), _jsx(View, { style: [a.pt_xl], children: profile.displayName ? (_jsxs(Prompt.Actions, { children: [_jsxs(Button, { variant: "solid", color: "primary", size: gtMobile ? 'small' : 'large', label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Verify account"], ["Verify account"])))), onPress: onConfirm, children: [_jsx(ButtonText, { children: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Verify account"], ["Verify account"])))) }), isPending && _jsx(ButtonIcon, { icon: Loader })] }), _jsx(Prompt.Cancel, {})] })) : (_jsx(Admonition, { type: "warning", children: _jsx(Trans, { children: "This user does not have a display name, and therefore cannot be verified." }) })) }), _jsx(Dialog.Close, {})] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
