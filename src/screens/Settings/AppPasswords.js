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
import { useCallback } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition, } from 'react-native-reanimated';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { cleanError } from '#/lib/strings/errors';
import { useAppPasswordDeleteMutation, useAppPasswordsQuery, } from '#/state/queries/app-passwords';
import { EmptyState } from '#/view/com/util/EmptyState';
import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { Growth_Stroke2_Corner0_Rounded as Growth } from '#/components/icons/Growth';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as Layout from '#/components/Layout';
import { Loader } from '#/components/Loader';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';
import { AddAppPasswordDialog } from './components/AddAppPasswordDialog';
import * as SettingsList from './components/SettingsList';
export function AppPasswordsScreen(_a) {
    var _ = useLingui()._;
    var _b = useAppPasswordsQuery(), appPasswords = _b.data, error = _b.error;
    var createAppPasswordControl = useDialogControl();
    return (_jsxs(Layout.Screen, { testID: "AppPasswordsScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "App Passwords" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: error ? (_jsx(ErrorScreen, { title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Oops!"], ["Oops!"])))), message: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["There was an issue fetching your app passwords"], ["There was an issue fetching your app passwords"])))), details: cleanError(error) })) : (_jsxs(SettingsList.Container, { children: [_jsx(SettingsList.Item, { children: _jsx(Admonition, { type: "tip", style: [a.flex_1], children: _jsx(Trans, { children: "Use app passwords to sign in to other Bluesky clients without giving full access to your account or password." }) }) }), _jsx(SettingsList.Item, { children: _jsxs(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Add App Password"], ["Add App Password"])))), size: "large", color: "primary", variant: "solid", onPress: function () { return createAppPasswordControl.open(); }, style: [a.flex_1], children: [_jsx(ButtonIcon, { icon: PlusIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Add App Password" }) })] }) }), _jsx(SettingsList.Divider, {}), _jsx(LayoutAnimationConfig, { skipEntering: true, skipExiting: true, children: appPasswords ? (appPasswords.length > 0 ? (_jsx(View, { style: [a.overflow_hidden], children: appPasswords.map(function (appPassword) { return (_jsx(Animated.View, { style: a.w_full, entering: FadeIn, exiting: FadeOut, layout: LinearTransition.delay(150), children: _jsx(SettingsList.Item, { children: _jsx(AppPasswordCard, { appPassword: appPassword }) }) }, appPassword.name)); }) })) : (_jsx(EmptyState, { icon: Growth, message: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["No app passwords yet"], ["No app passwords yet"])))) }))) : (_jsx(View, { style: [
                                    a.flex_1,
                                    a.justify_center,
                                    a.align_center,
                                    a.py_4xl,
                                ], children: _jsx(Loader, { size: "xl" }) })) })] })) }), _jsx(AddAppPasswordDialog, { control: createAppPasswordControl, passwords: (appPasswords === null || appPasswords === void 0 ? void 0 : appPasswords.map(function (p) { return p.name; })) || [] })] }));
}
function AppPasswordCard(_a) {
    var _this = this;
    var appPassword = _a.appPassword;
    var t = useTheme();
    var _b = useLingui(), i18n = _b.i18n, _ = _b._;
    var deleteControl = Prompt.usePromptControl();
    var deleteMutation = useAppPasswordDeleteMutation().mutateAsync;
    var onDelete = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, deleteMutation({ name: appPassword.name })];
                case 1:
                    _a.sent();
                    Toast.show(_(msg({ message: 'App password deleted', context: 'toast' })));
                    return [2 /*return*/];
            }
        });
    }); }, [deleteMutation, appPassword.name, _]);
    return (_jsxs(View, { style: [
            a.w_full,
            a.border,
            a.rounded_sm,
            a.px_md,
            a.py_sm,
            t.atoms.bg_contrast_25,
            t.atoms.border_contrast_low,
        ], children: [_jsxs(View, { style: [
                    a.flex_row,
                    a.justify_between,
                    a.align_start,
                    a.w_full,
                    a.gap_sm,
                ], children: [_jsxs(View, { style: [a.gap_xs], children: [_jsx(Text, { style: [t.atoms.text, a.text_md, a.font_semi_bold], children: appPassword.name }), _jsx(Text, { style: [t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["Created", ' ', i18n.date(appPassword.createdAt, {
                                            year: 'numeric',
                                            month: 'numeric',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })] }) })] }), _jsx(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Delete app password"], ["Delete app password"])))), variant: "ghost", color: "negative", size: "small", shape: "square", style: [a.bg_transparent], onPress: function () { return deleteControl.open(); }, children: _jsx(ButtonIcon, { icon: TrashIcon }) })] }), appPassword.privileged && (_jsxs(View, { style: [a.flex_row, a.gap_sm, a.align_center, a.mt_md], children: [_jsx(WarningIcon, { style: [{ color: t.palette.yellow }] }), _jsx(Text, { style: t.atoms.text_contrast_high, children: _jsx(Trans, { children: "Allows access to direct messages" }) })] })), _jsx(Prompt.Basic, { control: deleteControl, title: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Delete app password?"], ["Delete app password?"])))), description: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Are you sure you want to delete the app password \"", "\"?"], ["Are you sure you want to delete the app password \"", "\"?"])), appPassword.name)), onConfirm: onDelete, confirmButtonCta: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Delete"], ["Delete"])))), confirmButtonColor: "negative" })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
