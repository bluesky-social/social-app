var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { useEffect, useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition, SlideInRight, SlideOutLeft, } from 'react-native-reanimated';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { useAppPasswordCreateMutation } from '#/state/queries/app-passwords';
import { atoms as a, native, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as TextInput from '#/components/forms/TextField';
import * as Toggle from '#/components/forms/Toggle';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRight } from '#/components/icons/Chevron';
import { SquareBehindSquare4_Stroke2_Corner0_Rounded as CopyIcon } from '#/components/icons/SquareBehindSquare4';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
import { CopyButton } from './CopyButton';
export function AddAppPasswordDialog(_a) {
    var control = _a.control, passwords = _a.passwords;
    var height = useWindowDimensions().height;
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { minHeight: height }, children: [_jsx(Dialog.Handle, {}), _jsx(CreateDialogInner, { passwords: passwords })] }));
}
function CreateDialogInner(_a) {
    var _this = this;
    var passwords = _a.passwords;
    var control = Dialog.useDialogContext();
    var t = useTheme();
    var _ = useLingui()._;
    var autogeneratedName = useRandomName();
    var _b = useState(''), name = _b[0], setName = _b[1];
    var _c = useState(false), privileged = _c[0], setPrivileged = _c[1];
    var _d = useAppPasswordCreateMutation(), actuallyCreateAppPassword = _d.mutateAsync, apiError = _d.error, data = _d.data;
    var regexFailError = useMemo(function () {
        return new DisplayableError(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["App password names can only contain letters, numbers, spaces, dashes, and underscores"], ["App password names can only contain letters, numbers, spaces, dashes, and underscores"])))));
    }, [_]);
    var _e = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var chosenName;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chosenName = name.trim() || autogeneratedName;
                        if (chosenName.length < 4) {
                            throw new DisplayableError(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["App password names must be at least 4 characters long"], ["App password names must be at least 4 characters long"])))));
                        }
                        if (passwords.find(function (p) { return p === chosenName; })) {
                            throw new DisplayableError(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["App password name must be unique"], ["App password name must be unique"])))));
                        }
                        return [4 /*yield*/, actuallyCreateAppPassword({ name: chosenName, privileged: privileged })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
    }), createAppPassword = _e.mutate, validationError = _e.error, isPending = _e.isPending;
    var _f = useState(false), hasBeenCopied = _f[0], setHasBeenCopied = _f[1];
    useEffect(function () {
        if (hasBeenCopied) {
            var timeout_1 = setTimeout(function () { return setHasBeenCopied(false); }, 100);
            return function () { return clearTimeout(timeout_1); };
        }
    }, [hasBeenCopied]);
    var error = validationError || (!name.match(/^[a-zA-Z0-9-_ ]*$/) && regexFailError);
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Add app password"], ["Add app password"])))), children: [_jsx(View, { style: [native(a.pt_md)], children: _jsx(LayoutAnimationConfig, { skipEntering: true, skipExiting: true, children: !data ? (_jsxs(Animated.View, { style: [a.gap_lg], exiting: native(SlideOutLeft), children: [_jsx(Text, { style: [a.text_2xl, a.font_semi_bold], children: _jsx(Trans, { children: "Add App Password" }) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsx(Trans, { children: "Please enter a unique name for this app password or use our randomly generated one." }) }), _jsx(View, { children: _jsx(TextInput.Root, { isInvalid: !!error, children: _jsx(Dialog.Input, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["App Password"], ["App Password"])))), placeholder: autogeneratedName, onChangeText: setName, returnKeyType: "done", onSubmitEditing: function () { return createAppPassword(); }, blurOnSubmit: true, autoCorrect: false, autoComplete: "off", autoCapitalize: "none", autoFocus: true }) }) }), error instanceof DisplayableError && (_jsx(Animated.View, { entering: FadeIn, exiting: FadeOut, children: _jsx(Admonition, { type: "error", children: error.message }) })), _jsxs(Animated.View, { style: [a.gap_lg], layout: native(LinearTransition), children: [_jsxs(Toggle.Item, { name: "privileged", type: "checkbox", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Allow access to your direct messages"], ["Allow access to your direct messages"])))), value: privileged, onChange: setPrivileged, style: [a.flex_1], children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { style: [a.font_normal, a.text_md, a.leading_snug], children: _jsx(Trans, { children: "Allow access to your direct messages" }) })] }), _jsxs(Button, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Next"], ["Next"])))), size: "large", variant: "solid", color: "primary", style: [a.flex_1], onPress: function () { return createAppPassword(); }, disabled: isPending, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Next" }) }), _jsx(ButtonIcon, { icon: ChevronRight })] }), !!apiError ||
                                        (error && !(error instanceof DisplayableError) && (_jsx(Animated.View, { entering: FadeIn, exiting: FadeOut, children: _jsx(Admonition, { type: "error", children: _jsx(Trans, { children: "Failed to create app password. Please try again." }) }) })))] })] }, 0)) : (_jsxs(Animated.View, { style: [a.gap_lg], entering: IS_WEB ? FadeIn.delay(200) : SlideInRight, children: [_jsx(Text, { style: [a.text_2xl, a.font_semi_bold], children: _jsx(Trans, { children: "Here is your app password!" }) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsx(Trans, { children: "Use this to sign in to the other app along with your handle." }) }), _jsxs(CopyButton, { value: data.password, label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Copy App Password"], ["Copy App Password"])))), size: "large", color: "secondary", children: [_jsx(ButtonText, { children: data.password }), _jsx(ButtonIcon, { icon: CopyIcon })] }), _jsx(Text, { style: [
                                    a.text_md,
                                    a.leading_snug,
                                    t.atoms.text_contrast_medium,
                                ], children: _jsx(Trans, { children: "For security reasons, you won't be able to view this again. If you lose this app password, you'll need to generate a new one." }) }), _jsx(Button, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Done"], ["Done"])))), size: "large", variant: "outline", color: "primary", style: [a.flex_1], onPress: function () { return control.close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Done" }) }) })] }, 1)) }) }), _jsx(Dialog.Close, {})] }));
}
var DisplayableError = /** @class */ (function (_super) {
    __extends(DisplayableError, _super);
    function DisplayableError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'DisplayableError';
        return _this;
    }
    return DisplayableError;
}(Error));
function useRandomName() {
    return useState(function () { return shadesOfBlue[Math.floor(Math.random() * shadesOfBlue.length)]; })[0];
}
var shadesOfBlue = [
    'AliceBlue',
    'Aqua',
    'Aquamarine',
    'Azure',
    'BabyBlue',
    'Blue',
    'BlueViolet',
    'CadetBlue',
    'CornflowerBlue',
    'Cyan',
    'DarkBlue',
    'DarkCyan',
    'DarkSlateBlue',
    'DeepSkyBlue',
    'DodgerBlue',
    'ElectricBlue',
    'LightBlue',
    'LightCyan',
    'LightSkyBlue',
    'LightSteelBlue',
    'MediumAquaMarine',
    'MediumBlue',
    'MediumSlateBlue',
    'MidnightBlue',
    'Navy',
    'PowderBlue',
    'RoyalBlue',
    'SkyBlue',
    'SlateBlue',
    'SteelBlue',
    'Teal',
    'Turquoise',
];
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
