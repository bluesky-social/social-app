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
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { interests as allInterests, useInterestsDisplayNames, } from '#/lib/interests';
import { preferencesQueryKey, usePreferencesQuery, } from '#/state/queries/preferences';
import { createGetSuggestedFeedsQueryKey } from '#/state/queries/trending/useGetSuggestedFeedsQuery';
import { createGetSuggestedUsersQueryKey } from '#/state/queries/trending/useGetSuggestedUsersQuery';
import { createSuggestedStarterPacksQueryKey } from '#/state/queries/useSuggestedStarterPacksQuery';
import { useAgent } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useGutters, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Divider } from '#/components/Divider';
import * as Toggle from '#/components/forms/Toggle';
import * as Layout from '#/components/Layout';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
export function InterestsSettingsScreen(_a) {
    var t = useTheme();
    var gutters = useGutters(['base']);
    var preferences = usePreferencesQuery().data;
    var _b = useState(false), isSaving = _b[0], setIsSaving = _b[1];
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Your interests" }) }) }), _jsx(Layout.Header.Slot, { children: isSaving && _jsx(Loader, {}) })] }), _jsx(Layout.Content, { children: _jsxs(View, { style: [gutters, a.gap_lg], children: [_jsx(Text, { style: [
                                a.flex_1,
                                a.text_sm,
                                a.leading_snug,
                                t.atoms.text_contrast_medium,
                            ], children: _jsx(Trans, { children: "Your selected interests help us serve you content you care about." }) }), _jsx(Divider, {}), preferences ? (_jsx(Inner, { preferences: preferences, setIsSaving: setIsSaving })) : (_jsx(View, { style: [a.flex_row, a.justify_center, a.p_lg], children: _jsx(Loader, { size: "xl" }) }))] }) })] }));
}
function Inner(_a) {
    var _this = this;
    var preferences = _a.preferences, setIsSaving = _a.setIsSaving;
    var _ = useLingui()._;
    var agent = useAgent();
    var qc = useQueryClient();
    var interestsDisplayNames = useInterestsDisplayNames();
    var preselectedInterests = useMemo(function () { return preferences.interests.tags || []; }, [preferences.interests.tags]);
    var _b = useState(preselectedInterests), interests = _b[0], setInterests = _b[1];
    var saveInterests = useMemo(function () {
        return debounce(function (interests) { return __awaiter(_this, void 0, void 0, function () {
            var noEdits, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        noEdits = interests.length === preselectedInterests.length &&
                            preselectedInterests.every(function (pre) {
                                return interests.find(function (int) { return int === pre; });
                            });
                        if (noEdits)
                            return [2 /*return*/];
                        setIsSaving(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, agent.setInterestsPref({ tags: interests })];
                    case 2:
                        _a.sent();
                        qc.setQueriesData({ queryKey: preferencesQueryKey }, function (old) {
                            if (!old)
                                return old;
                            old.interests.tags = interests;
                            return old;
                        });
                        return [4 /*yield*/, Promise.all([
                                qc.resetQueries({ queryKey: createSuggestedStarterPacksQueryKey() }),
                                qc.resetQueries({ queryKey: createGetSuggestedFeedsQueryKey() }),
                                qc.resetQueries({ queryKey: createGetSuggestedUsersQueryKey({}) }),
                            ])];
                    case 3:
                        _a.sent();
                        Toast.show(_(msg({
                            message: 'Your interests have been updated!',
                            context: 'toast',
                        })));
                        return [3 /*break*/, 6];
                    case 4:
                        error_1 = _a.sent();
                        Toast.show(_(msg({
                            message: 'Failed to save your interests.',
                            context: 'toast',
                        })), 'xmark');
                        return [3 /*break*/, 6];
                    case 5:
                        setIsSaving(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        }); }, 1500);
    }, [_, agent, setIsSaving, qc, preselectedInterests]);
    var onChangeInterests = function (interests) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            setInterests(interests);
            saveInterests(interests);
            return [2 /*return*/];
        });
    }); };
    return (_jsxs(_Fragment, { children: [interests.length === 0 && (_jsx(Admonition, { type: "tip", children: _jsx(Trans, { children: "We recommend selecting at least two interests." }) })), _jsx(Toggle.Group, { values: interests, onChange: onChangeInterests, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Select your interests from the options below"], ["Select your interests from the options below"])))), children: _jsx(View, { style: [a.flex_row, a.flex_wrap, a.gap_sm], children: allInterests.map(function (interest) {
                        var name = interestsDisplayNames[interest];
                        if (!name)
                            return null;
                        return (_jsx(Toggle.Item, { name: interest, label: interestsDisplayNames[interest], children: _jsx(InterestButton, { interest: interest }) }, interest));
                    }) }) })] }));
}
export function InterestButton(_a) {
    var interest = _a.interest;
    var t = useTheme();
    var interestsDisplayNames = useInterestsDisplayNames();
    var ctx = Toggle.useItemContext();
    var styles = useMemo(function () {
        var hovered = [t.atoms.bg_contrast_100];
        var focused = [];
        var pressed = [];
        var selected = [t.atoms.bg_contrast_900];
        var selectedHover = [t.atoms.bg_contrast_975];
        var textSelected = [t.atoms.text_inverted];
        return {
            hovered: hovered,
            focused: focused,
            pressed: pressed,
            selected: selected,
            selectedHover: selectedHover,
            textSelected: textSelected,
        };
    }, [t]);
    return (_jsx(View, { style: [
            a.rounded_full,
            a.py_md,
            a.px_xl,
            t.atoms.bg_contrast_50,
            ctx.hovered ? styles.hovered : {},
            ctx.focused ? styles.hovered : {},
            ctx.pressed ? styles.hovered : {},
            ctx.selected ? styles.selected : {},
            ctx.selected && (ctx.hovered || ctx.focused || ctx.pressed)
                ? styles.selectedHover
                : {},
        ], children: _jsx(Text, { selectable: false, style: [
                {
                    color: t.palette.contrast_900,
                },
                a.font_semi_bold,
                ctx.selected ? styles.textSelected : {},
            ], children: interestsDisplayNames[interest] }) }));
}
var templateObject_1;
