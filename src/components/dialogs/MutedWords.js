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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { sanitizeMutedWordValue } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { logger } from '#/logger';
import { usePreferencesQuery, useRemoveMutedWordMutation, useUpdateMutedWordMutation, useUpsertMutedWordsMutation, } from '#/state/queries/preferences';
import { atoms as a, native, useBreakpoints, useTheme, web, } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { Divider } from '#/components/Divider';
import * as Toggle from '#/components/forms/Toggle';
import { useFormatDistance } from '#/components/hooks/dates';
import { Hashtag_Stroke2_Corner0_Rounded as Hashtag } from '#/components/icons/Hashtag';
import { PageText_Stroke2_Corner0_Rounded as PageText } from '#/components/icons/PageText';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Loader } from '#/components/Loader';
import * as Menu from '#/components/Menu';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
var ONE_DAY = 24 * 60 * 60 * 1000;
export function MutedWordsDialog() {
    var control = useGlobalDialogsControlContext().mutedWordsDialogControl;
    return (_jsxs(Dialog.Outer, { control: control, children: [_jsx(Dialog.Handle, {}), _jsx(MutedWordsInner, {})] }));
}
function MutedWordsInner() {
    var _this = this;
    var t = useTheme();
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var _a = usePreferencesQuery(), isPreferencesLoading = _a.isLoading, preferences = _a.data, preferencesError = _a.error;
    var _b = useUpsertMutedWordsMutation(), isPending = _b.isPending, addMutedWord = _b.mutateAsync;
    var _c = React.useState(''), field = _c[0], setField = _c[1];
    var _d = React.useState(['content']), targets = _d[0], setTargets = _d[1];
    var _e = React.useState(''), error = _e[0], setError = _e[1];
    var _f = React.useState(['forever']), durations = _f[0], setDurations = _f[1];
    var _g = React.useState(false), excludeFollowing = _g[0], setExcludeFollowing = _g[1];
    var submit = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var sanitizedValue, surfaces, actorTarget, now, rawDuration, duration, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sanitizedValue = sanitizeMutedWordValue(field);
                    surfaces = ['tag', targets.includes('content') && 'content'].filter(Boolean);
                    actorTarget = excludeFollowing ? 'exclude-following' : 'all';
                    now = Date.now();
                    rawDuration = durations.at(0);
                    if (rawDuration === '24_hours') {
                        duration = new Date(now + ONE_DAY).toISOString();
                    }
                    else if (rawDuration === '7_days') {
                        duration = new Date(now + 7 * ONE_DAY).toISOString();
                    }
                    else if (rawDuration === '30_days') {
                        duration = new Date(now + 30 * ONE_DAY).toISOString();
                    }
                    if (!sanitizedValue || !surfaces.length) {
                        setField('');
                        setError(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Please enter a valid word, tag, or phrase to mute"], ["Please enter a valid word, tag, or phrase to mute"])))));
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    // send raw value and rely on SDK as sanitization source of truth
                    return [4 /*yield*/, addMutedWord([
                            {
                                value: field,
                                targets: surfaces,
                                actorTarget: actorTarget,
                                expiresAt: duration,
                            },
                        ])];
                case 2:
                    // send raw value and rely on SDK as sanitization source of truth
                    _a.sent();
                    setField('');
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    logger.error("Failed to save muted word", { message: e_1.message });
                    setError(e_1.message);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [_, field, targets, addMutedWord, setField, durations, excludeFollowing]);
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Manage your muted words and tags"], ["Manage your muted words and tags"])))), children: [_jsxs(View, { children: [_jsx(Text, { style: [
                            a.text_md,
                            a.font_semi_bold,
                            a.pb_sm,
                            t.atoms.text_contrast_high,
                        ], children: _jsx(Trans, { children: "Add muted words and tags" }) }), _jsx(Text, { style: [a.pb_lg, a.leading_snug, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Posts can be muted based on their text, their tags, or both. We recommend avoiding common words that appear in many posts, since it can result in no posts being shown." }) }), _jsx(View, { style: [a.pb_sm], children: _jsx(Dialog.Input, { autoCorrect: false, autoCapitalize: "none", autoComplete: "off", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Enter a word or tag"], ["Enter a word or tag"])))), placeholder: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Enter a word or tag"], ["Enter a word or tag"])))), value: field, onChangeText: function (value) {
                                if (error) {
                                    setError('');
                                }
                                setField(value);
                            }, onSubmitEditing: submit }) }), _jsxs(View, { style: [a.pb_xl, a.gap_sm], children: [_jsxs(Toggle.Group, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Select how long to mute this word for."], ["Select how long to mute this word for."])))), type: "radio", values: durations, onChange: setDurations, children: [_jsx(Text, { style: [
                                            a.pb_xs,
                                            a.text_sm,
                                            a.font_semi_bold,
                                            t.atoms.text_contrast_medium,
                                        ], children: _jsx(Trans, { children: "Duration:" }) }), _jsxs(View, { style: [
                                            gtMobile && [a.flex_row, a.align_center, a.justify_start],
                                            a.gap_sm,
                                        ], children: [_jsxs(View, { style: [
                                                    a.flex_1,
                                                    a.flex_row,
                                                    a.justify_start,
                                                    a.align_center,
                                                    a.gap_sm,
                                                ], children: [_jsx(Toggle.Item, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Mute this word until you unmute it"], ["Mute this word until you unmute it"])))), name: "forever", style: [a.flex_1], children: _jsx(TargetToggle, { children: _jsxs(View, { style: [a.flex_1, a.flex_row, a.align_center, a.gap_sm], children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { style: [a.flex_1, a.leading_tight], children: _jsx(Trans, { children: "Forever" }) })] }) }) }), _jsx(Toggle.Item, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Mute this word for 24 hours"], ["Mute this word for 24 hours"])))), name: "24_hours", style: [a.flex_1], children: _jsx(TargetToggle, { children: _jsxs(View, { style: [a.flex_1, a.flex_row, a.align_center, a.gap_sm], children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { style: [a.flex_1, a.leading_tight], children: _jsx(Trans, { children: "24 hours" }) })] }) }) })] }), _jsxs(View, { style: [
                                                    a.flex_1,
                                                    a.flex_row,
                                                    a.justify_start,
                                                    a.align_center,
                                                    a.gap_sm,
                                                ], children: [_jsx(Toggle.Item, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Mute this word for 7 days"], ["Mute this word for 7 days"])))), name: "7_days", style: [a.flex_1], children: _jsx(TargetToggle, { children: _jsxs(View, { style: [a.flex_1, a.flex_row, a.align_center, a.gap_sm], children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { style: [a.flex_1, a.leading_tight], children: _jsx(Trans, { children: "7 days" }) })] }) }) }), _jsx(Toggle.Item, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Mute this word for 30 days"], ["Mute this word for 30 days"])))), name: "30_days", style: [a.flex_1], children: _jsx(TargetToggle, { children: _jsxs(View, { style: [a.flex_1, a.flex_row, a.align_center, a.gap_sm], children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { style: [a.flex_1, a.leading_tight], children: _jsx(Trans, { children: "30 days" }) })] }) }) })] })] })] }), _jsxs(Toggle.Group, { label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Select what content this mute word should apply to."], ["Select what content this mute word should apply to."])))), type: "radio", values: targets, onChange: setTargets, children: [_jsx(Text, { style: [
                                            a.pb_xs,
                                            a.text_sm,
                                            a.font_semi_bold,
                                            t.atoms.text_contrast_medium,
                                        ], children: _jsx(Trans, { children: "Mute in:" }) }), _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_sm, a.flex_wrap], children: [_jsx(Toggle.Item, { label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Mute this word in post text and tags"], ["Mute this word in post text and tags"])))), name: "content", style: [a.flex_1], children: _jsxs(TargetToggle, { children: [_jsxs(View, { style: [a.flex_1, a.flex_row, a.align_center, a.gap_sm], children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { style: [a.flex_1, a.leading_tight], children: _jsx(Trans, { children: "Text & tags" }) })] }), _jsx(PageText, { size: "sm" })] }) }), _jsx(Toggle.Item, { label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Mute this word in tags only"], ["Mute this word in tags only"])))), name: "tag", style: [a.flex_1], children: _jsxs(TargetToggle, { children: [_jsxs(View, { style: [a.flex_1, a.flex_row, a.align_center, a.gap_sm], children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { style: [a.flex_1, a.leading_tight], children: _jsx(Trans, { children: "Tags only" }) })] }), _jsx(Hashtag, { size: "sm" })] }) })] })] }), _jsxs(View, { children: [_jsx(Text, { style: [
                                            a.pb_xs,
                                            a.text_sm,
                                            a.font_semi_bold,
                                            t.atoms.text_contrast_medium,
                                        ], children: _jsx(Trans, { children: "Options:" }) }), _jsx(Toggle.Item, { label: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Do not apply this mute word to users you follow"], ["Do not apply this mute word to users you follow"])))), name: "exclude_following", style: [a.flex_row, a.justify_between], value: excludeFollowing, onChange: setExcludeFollowing, children: _jsx(TargetToggle, { children: _jsxs(View, { style: [a.flex_1, a.flex_row, a.align_center, a.gap_sm], children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { style: [a.flex_1, a.leading_tight], children: _jsx(Trans, { children: "Exclude users you follow" }) })] }) }) })] }), _jsx(View, { style: [a.pt_xs], children: _jsxs(Button, { disabled: isPending || !field, label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Add mute word with chosen settings"], ["Add mute word with chosen settings"])))), size: "large", color: "primary", variant: "solid", style: [], onPress: submit, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Add" }) }), _jsx(ButtonIcon, { icon: isPending ? Loader : Plus, position: "right" })] }) }), error && (_jsx(View, { style: [
                                    a.mb_lg,
                                    a.flex_row,
                                    a.rounded_sm,
                                    a.p_md,
                                    a.mb_xs,
                                    t.atoms.bg_contrast_25,
                                    {
                                        backgroundColor: t.palette.negative_400,
                                    },
                                ], children: _jsx(Text, { style: [
                                        a.italic,
                                        { color: t.palette.white },
                                        native({ marginTop: 2 }),
                                    ], children: error }) }))] }), _jsx(Divider, {}), _jsxs(View, { style: [a.pt_2xl], children: [_jsx(Text, { style: [
                                    a.text_md,
                                    a.font_semi_bold,
                                    a.pb_md,
                                    t.atoms.text_contrast_high,
                                ], children: _jsx(Trans, { children: "Your muted words" }) }), isPreferencesLoading ? (_jsx(Loader, {})) : preferencesError || !preferences ? (_jsx(View, { style: [a.py_md, a.px_lg, a.rounded_md, t.atoms.bg_contrast_25], children: _jsx(Text, { style: [a.italic, t.atoms.text_contrast_high], children: _jsx(Trans, { children: "We're sorry, but we weren't able to load your muted words at this time. Please try again." }) }) })) : preferences.moderationPrefs.mutedWords.length ? (__spreadArray([], preferences.moderationPrefs.mutedWords, true).reverse()
                                .map(function (word, i) { return (_jsx(MutedWordRow, { word: word, style: [i % 2 === 0 && t.atoms.bg_contrast_25] }, word.value + i)); })) : (_jsx(View, { style: [a.py_md, a.px_lg, a.rounded_md, t.atoms.bg_contrast_25], children: _jsx(Text, { style: [a.italic, t.atoms.text_contrast_high], children: _jsx(Trans, { children: "You haven't muted any words or tags yet" }) }) }))] }), IS_NATIVE && _jsx(View, { style: { height: 20 } })] }), _jsx(Dialog.Close, {})] }));
}
function MutedWordRow(_a) {
    var _this = this;
    var style = _a.style, word = _a.word;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = useRemoveMutedWordMutation(), isPending = _b.isPending, removeMutedWord = _b.mutateAsync;
    var updateMutedWord = useUpdateMutedWordMutation().mutateAsync;
    var control = Prompt.usePromptControl();
    var expiryDate = word.expiresAt ? new Date(word.expiresAt) : undefined;
    var isExpired = expiryDate && expiryDate < new Date();
    var formatDistance = useFormatDistance();
    var remove = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            control.close();
            removeMutedWord(word);
            return [2 /*return*/];
        });
    }); }, [removeMutedWord, word, control]);
    var renew = function (days) {
        updateMutedWord(__assign(__assign({}, word), { expiresAt: days
                ? new Date(Date.now() + days * ONE_DAY).toISOString()
                : undefined }));
    };
    return (_jsxs(_Fragment, { children: [_jsx(Prompt.Basic, { control: control, title: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Are you sure?"], ["Are you sure?"])))), description: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["This will delete \"", "\" from your muted words. You can always add it back later."], ["This will delete \"", "\" from your muted words. You can always add it back later."])), word.value)), onConfirm: remove, confirmButtonCta: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Remove"], ["Remove"])))), confirmButtonColor: "negative" }), _jsxs(View, { style: [
                    a.flex_row,
                    a.justify_between,
                    a.py_md,
                    a.px_lg,
                    a.rounded_md,
                    a.gap_md,
                    style,
                ], children: [_jsxs(View, { style: [a.flex_1, a.gap_xs], children: [_jsx(View, { style: [a.flex_row, a.align_center, a.gap_sm], children: _jsx(Text, { style: [
                                        a.flex_1,
                                        a.leading_snug,
                                        a.font_semi_bold,
                                        web({
                                            overflowWrap: 'break-word',
                                            wordBreak: 'break-word',
                                        }),
                                    ], children: word.targets.find(function (t) { return t === 'content'; }) ? (_jsxs(Trans, { comment: "Pattern: {wordValue} in text, tags", children: [word.value, ' ', _jsxs(Text, { style: [a.font_normal, t.atoms.text_contrast_medium], children: ["in", ' ', _jsx(Text, { style: [a.font_semi_bold, t.atoms.text_contrast_medium], children: "text & tags" })] })] })) : (_jsxs(Trans, { comment: "Pattern: {wordValue} in tags", children: [word.value, ' ', _jsxs(Text, { style: [a.font_normal, t.atoms.text_contrast_medium], children: ["in", ' ', _jsx(Text, { style: [a.font_semi_bold, t.atoms.text_contrast_medium], children: "tags" })] })] })) }) }), (expiryDate || word.actorTarget === 'exclude-following') && (_jsxs(View, { style: [a.flex_1, a.flex_row, a.align_center, a.flex_wrap], children: [expiryDate &&
                                        (isExpired ? (_jsxs(_Fragment, { children: [_jsx(Text, { style: [
                                                        a.text_xs,
                                                        a.leading_snug,
                                                        t.atoms.text_contrast_medium,
                                                    ], children: _jsx(Trans, { children: "Expired" }) }), _jsx(Text, { style: [
                                                        a.text_xs,
                                                        a.leading_snug,
                                                        t.atoms.text_contrast_medium,
                                                    ], children: ' · ' }), _jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Renew mute word"], ["Renew mute word"])))), children: function (_a) {
                                                                var props = _a.props;
                                                                return (_jsx(Text, __assign({}, props, { style: [
                                                                        a.text_xs,
                                                                        a.leading_snug,
                                                                        a.font_semi_bold,
                                                                        { color: t.palette.primary_500 },
                                                                    ], children: _jsx(Trans, { children: "Renew" }) })));
                                                            } }), _jsxs(Menu.Outer, { children: [_jsx(Menu.LabelText, { children: _jsx(Trans, { children: "Renew duration" }) }), _jsxs(Menu.Group, { children: [_jsx(Menu.Item, { label: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["24 hours"], ["24 hours"])))), onPress: function () { return renew(1); }, children: _jsx(Menu.ItemText, { children: _jsx(Trans, { children: "24 hours" }) }) }), _jsx(Menu.Item, { label: _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["7 days"], ["7 days"])))), onPress: function () { return renew(7); }, children: _jsx(Menu.ItemText, { children: _jsx(Trans, { children: "7 days" }) }) }), _jsx(Menu.Item, { label: _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["30 days"], ["30 days"])))), onPress: function () { return renew(30); }, children: _jsx(Menu.ItemText, { children: _jsx(Trans, { children: "30 days" }) }) }), _jsx(Menu.Item, { label: _(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Forever"], ["Forever"])))), onPress: function () { return renew(); }, children: _jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Forever" }) }) })] })] })] })] })) : (_jsx(Text, { style: [
                                                a.text_xs,
                                                a.leading_snug,
                                                t.atoms.text_contrast_medium,
                                            ], children: _jsxs(Trans, { children: ["Expires", ' ', formatDistance(expiryDate, new Date(), {
                                                        addSuffix: true,
                                                    })] }) }))), word.actorTarget === 'exclude-following' && (_jsxs(Text, { style: [
                                            a.text_xs,
                                            a.leading_snug,
                                            t.atoms.text_contrast_medium,
                                        ], children: [expiryDate ? ' · ' : '', _jsx(Trans, { children: "Excludes users you follow" })] }))] }))] }), _jsx(Button, { label: _(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["Remove mute word from your list"], ["Remove mute word from your list"])))), size: "tiny", shape: "round", variant: "outline", color: "secondary", onPress: function () { return control.open(); }, style: [a.ml_sm], children: _jsx(ButtonIcon, { icon: isPending ? Loader : X }) })] })] }));
}
function TargetToggle(_a) {
    var children = _a.children;
    var t = useTheme();
    var ctx = Toggle.useItemContext();
    var gtMobile = useBreakpoints().gtMobile;
    return (_jsx(View, { style: [
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.gap_xs,
            a.flex_1,
            a.py_sm,
            a.px_sm,
            gtMobile && a.px_md,
            a.rounded_sm,
            t.atoms.bg_contrast_25,
            (ctx.hovered || ctx.focused) && t.atoms.bg_contrast_50,
            ctx.selected && [
                {
                    backgroundColor: t.palette.primary_50,
                },
            ],
            ctx.disabled && {
                opacity: 0.8,
            },
        ], children: children }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23;
