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
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useCleanError } from '#/lib/hooks/useCleanError';
import { isAppPassword } from '#/lib/jwt';
import { getAge, getDateAgo } from '#/lib/strings/time';
import { logger } from '#/logger';
import { useBirthdateMutation, useIsBirthdateUpdateAllowed, } from '#/state/birthdate';
import { usePreferencesQuery, } from '#/state/queries/preferences';
import { useSession } from '#/state/session';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { atoms as a, useTheme, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { DateField } from '#/components/forms/DateField';
import { SimpleInlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { Span, Text } from '#/components/Typography';
import { IS_IOS, IS_WEB } from '#/env';
export function BirthDateSettingsDialog(_a) {
    var control = _a.control;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = usePreferencesQuery(), isLoading = _b.isLoading, error = _b.error, preferences = _b.data;
    var isBirthdateUpdateAllowed = useIsBirthdateUpdateAllowed();
    var currentAccount = useSession().currentAccount;
    var isUsingAppPassword = isAppPassword((currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.accessJwt) || '');
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), isBirthdateUpdateAllowed ? (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["My Birthdate"], ["My Birthdate"])))), style: web({ maxWidth: 400 }), children: [_jsxs(View, { style: [a.gap_md], children: [_jsx(Text, { style: [a.text_xl, a.font_semi_bold], children: _jsx(Trans, { children: "My Birthdate" }) }), _jsx(Text, { style: [a.text_md, a.leading_snug, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "This information is private and not shared with other users." }) }), isLoading ? (_jsx(Loader, { size: "xl" })) : error || !preferences ? (_jsx(ErrorMessage, { message: (error === null || error === void 0 ? void 0 : error.toString()) ||
                                    _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["We were unable to load your birthdate preferences. Please try again."], ["We were unable to load your birthdate preferences. Please try again."])))), style: [a.rounded_sm] })) : isUsingAppPassword ? (_jsx(Admonition, { type: "info", children: _jsxs(Trans, { children: ["Hmm, it looks like you're signed in with an", ' ', _jsx(Span, { style: [a.italic], children: "App Password" }), ". To set your birthdate, you'll need to sign in with your main account password, or ask whomever controls this account to do so."] }) })) : (_jsx(BirthdayInner, { control: control, preferences: preferences }))] }), _jsx(Dialog.Close, {})] })) : (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["You recently changed your birthdate"], ["You recently changed your birthdate"])))), style: web({ maxWidth: 400 }), children: [_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [
                                    a.text_xl,
                                    a.font_semi_bold,
                                    a.leading_snug,
                                    { paddingRight: 32 },
                                ], children: _jsx(Trans, { children: "You recently changed your birthdate" }) }), _jsx(Text, { style: [a.text_md, a.leading_snug, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "There is a limit to how often you can change your birthdate. You may need to wait a day or two before updating it again." }) })] }), _jsx(Dialog.Close, {})] }))] }));
}
function BirthdayInner(_a) {
    var _this = this;
    var control = _a.control, preferences = _a.preferences;
    var _ = useLingui()._;
    var cleanError = useCleanError();
    var _b = React.useState(preferences.birthDate || getDateAgo(18)), date = _b[0], setDate = _b[1];
    var _c = useBirthdateMutation(), isPending = _c.isPending, error = _c.error, setBirthDate = _c.mutateAsync;
    var hasChanged = date !== preferences.birthDate;
    var errorMessage = React.useMemo(function () {
        if (error) {
            var _a = cleanError(error), raw = _a.raw, clean = _a.clean;
            return clean || raw || error.toString();
        }
    }, [error, cleanError]);
    var age = getAge(new Date(date));
    var isUnder13 = age < 13;
    var isUnder18 = age >= 13 && age < 18;
    var onSave = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (!hasChanged) return [3 /*break*/, 2];
                    return [4 /*yield*/, setBirthDate({ birthDate: date })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    control.close();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    logger.error("setBirthDate failed", { message: e_1.message });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [date, setBirthDate, control, hasChanged]);
    return (_jsxs(View, { style: a.gap_lg, testID: "birthDateSettingsDialog", children: [_jsx(View, { style: IS_IOS && [a.w_full, a.align_center], children: _jsx(DateField, { testID: "birthdayInput", value: date, onChangeDate: function (newDate) { return setDate(new Date(newDate)); }, label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Birthdate"], ["Birthdate"])))), accessibilityHint: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Enter your birthdate"], ["Enter your birthdate"])))) }) }), isUnder18 && hasChanged && (_jsx(Admonition, { type: "info", children: _jsx(Trans, { children: "The birthdate you've entered means you are under 18 years old. Certain content and features may be unavailable to you." }) })), isUnder13 && (_jsx(Admonition, { type: "error", children: _jsxs(Trans, { children: ["You must be at least 13 years old to use Bluesky. Read our", ' ', _jsx(SimpleInlineLinkText, { to: "https://bsky.social/about/support/tos", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Terms of Service"], ["Terms of Service"])))), children: "Terms of Service" }), ' ', "for more information."] }) })), errorMessage ? (_jsx(ErrorMessage, { message: errorMessage, style: [a.rounded_sm] })) : undefined, _jsx(View, { style: IS_WEB && [a.flex_row, a.justify_end], children: _jsxs(Button, { label: hasChanged ? _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Save birthdate"], ["Save birthdate"])))) : _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Done"], ["Done"])))), size: "large", onPress: onSave, variant: "solid", color: "primary", disabled: isUnder13, children: [_jsx(ButtonText, { children: hasChanged ? _jsx(Trans, { children: "Save" }) : _jsx(Trans, { children: "Done" }) }), isPending && _jsx(ButtonIcon, { icon: Loader })] }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
