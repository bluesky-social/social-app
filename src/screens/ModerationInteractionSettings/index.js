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
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import deepEqual from 'fast-deep-equal';
import { logger } from '#/logger';
import { usePostInteractionSettingsMutation } from '#/state/queries/post-interaction-settings';
import { createPostgateRecord } from '#/state/queries/postgate/util';
import { usePreferencesQuery, } from '#/state/queries/preferences';
import { threadgateAllowUISettingToAllowRecordValue, threadgateRecordToAllowUISetting, } from '#/state/queries/threadgate';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useGutters } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { PostInteractionSettingsForm } from '#/components/dialogs/PostInteractionSettingsDialog';
import * as Layout from '#/components/Layout';
import { Loader } from '#/components/Loader';
export function Screen() {
    var gutters = useGutters(['base']);
    var preferences = usePreferencesQuery().data;
    return (_jsxs(Layout.Screen, { testID: "ModerationInteractionSettingsScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Post Interaction Settings" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(View, { style: [gutters, a.gap_xl], children: [_jsx(Admonition, { type: "tip", children: _jsx(Trans, { children: "The following settings will be used as your defaults when creating new posts. You can edit these for a specific post from the composer." }) }), preferences ? (_jsx(Inner, { preferences: preferences })) : (_jsx(View, { style: [gutters, a.justify_center, a.align_center], children: _jsx(Loader, { size: "xl" }) }))] }) })] }));
}
function Inner(_a) {
    var _this = this;
    var preferences = _a.preferences;
    var _ = useLingui()._;
    var _b = usePostInteractionSettingsMutation(), setPostInteractionSettings = _b.mutateAsync, isPending = _b.isPending;
    var _c = React.useState(undefined), error = _c[0], setError = _c[1];
    var allowUI = React.useMemo(function () {
        return threadgateRecordToAllowUISetting({
            $type: 'app.bsky.feed.threadgate',
            post: '',
            createdAt: new Date().toString(),
            allow: preferences.postInteractionSettings.threadgateAllowRules,
        });
    }, [preferences.postInteractionSettings.threadgateAllowRules]);
    var postgate = React.useMemo(function () {
        return createPostgateRecord({
            post: '',
            embeddingRules: preferences.postInteractionSettings.postgateEmbeddingRules,
        });
    }, [preferences.postInteractionSettings.postgateEmbeddingRules]);
    var _d = React.useState(allowUI), maybeEditedAllowUI = _d[0], setAllowUI = _d[1];
    var _e = React.useState(postgate), maybeEditedPostgate = _e[0], setEditedPostgate = _e[1];
    var wasEdited = React.useMemo(function () {
        return (!deepEqual(allowUI, maybeEditedAllowUI) ||
            !deepEqual(postgate.embeddingRules, maybeEditedPostgate.embeddingRules));
    }, [postgate, allowUI, maybeEditedAllowUI, maybeEditedPostgate]);
    var onSave = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setError('');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, setPostInteractionSettings({
                            threadgateAllowRules: threadgateAllowUISettingToAllowRecordValue(maybeEditedAllowUI),
                            postgateEmbeddingRules: (_a = maybeEditedPostgate.embeddingRules) !== null && _a !== void 0 ? _a : [],
                        })];
                case 2:
                    _b.sent();
                    Toast.show(_(msg({ message: 'Settings saved', context: 'toast' })));
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _b.sent();
                    logger.error("Failed to save post interaction settings", {
                        source: 'ModerationInteractionSettingsScreen',
                        safeMessage: e_1.message,
                    });
                    setError(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Failed to save settings. Please try again."], ["Failed to save settings. Please try again."])))));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [_, maybeEditedPostgate, maybeEditedAllowUI, setPostInteractionSettings]);
    return (_jsxs(_Fragment, { children: [_jsx(PostInteractionSettingsForm, { canSave: wasEdited, isSaving: isPending, onSave: onSave, postgate: maybeEditedPostgate, onChangePostgate: setEditedPostgate, threadgateAllowUISettings: maybeEditedAllowUI, onChangeThreadgateAllowUISettings: setAllowUI }), error && _jsx(Admonition, { type: "error", children: error })] }));
}
var templateObject_1;
