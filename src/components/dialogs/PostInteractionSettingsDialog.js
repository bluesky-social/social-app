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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { LayoutAnimation, Text as NestedText, View } from 'react-native';
import { AtUri, } from '@atproto/api';
import { msg, Plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useHaptics } from '#/lib/haptics';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { STALE } from '#/state/queries';
import { useMyListsQuery } from '#/state/queries/my-lists';
import { useGetPost } from '#/state/queries/post';
import { createPostgateQueryKey, getPostgateRecord, usePostgateQuery, useWritePostgateMutation, } from '#/state/queries/postgate';
import { createPostgateRecord, embeddingRules, } from '#/state/queries/postgate/util';
import { createThreadgateViewQueryKey, threadgateViewToAllowUISetting, useSetThreadgateAllowMutation, useThreadgateViewQuery, } from '#/state/queries/threadgate';
import { PostThreadContextProvider, usePostThreadContext, } from '#/state/queries/usePostThread';
import { useAgent, useSession } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as Toggle from '#/components/forms/Toggle';
import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon, ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon, } from '#/components/icons/Chevron';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon } from '#/components/icons/Quote';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_IOS } from '#/env';
/**
 * Threadgate settings dialog. Used in the composer.
 */
export function PostInteractionSettingsControlledDialog(_a) {
    var control = _a.control, rest = __rest(_a, ["control"]);
    var ax = useAnalytics();
    var onClose = useNonReactiveCallback(function () {
        var _a, _b, _c, _d, _e;
        ax.metric('composer:threadgate:save', {
            hasChanged: !!rest.isDirty,
            persist: !!rest.persist,
            replyOptions: (_c = (_b = (_a = rest.threadgateAllowUISettings) === null || _a === void 0 ? void 0 : _a.map(function (gate) { return gate.type; })) === null || _b === void 0 ? void 0 : _b.join(',')) !== null && _c !== void 0 ? _c : '',
            quotesEnabled: !((_e = (_d = rest.postgate) === null || _d === void 0 ? void 0 : _d.embeddingRules) === null || _e === void 0 ? void 0 : _e.find(function (v) { return v.$type === embeddingRules.disableRule.$type; })),
        });
    });
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: {
            preventExpansion: true,
            preventDismiss: rest.isDirty && rest.persist,
        }, onClose: onClose, children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, __assign({}, rest))] }));
}
function DialogInner(props) {
    var _ = useLingui()._;
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Edit post interaction settings"], ["Edit post interaction settings"])))), style: [web({ maxWidth: 400 }), a.w_full], children: [_jsx(Header, {}), _jsx(PostInteractionSettingsForm, __assign({}, props)), _jsx(Dialog.Close, {})] }));
}
/**
 * Threadgate settings dialog. Used in the thread.
 */
export function PostInteractionSettingsDialog(props) {
    var postThreadContext = usePostThreadContext();
    return (_jsxs(Dialog.Outer, { control: props.control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(PostThreadContextProvider, { context: postThreadContext, children: _jsx(PostInteractionSettingsDialogControlledInner, __assign({}, props)) })] }));
}
export function PostInteractionSettingsDialogControlledInner(props) {
    var _this = this;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var _a = useState(false), isSaving = _a[0], setIsSaving = _a[1];
    var _b = useThreadgateViewQuery({ postUri: props.rootPostUri }), threadgateViewLoaded = _b.data, isLoadingThreadgate = _b.isLoading;
    var _c = usePostgateQuery({
        postUri: props.postUri,
    }), postgate = _c.data, isLoadingPostgate = _c.isLoading;
    var writePostgateRecord = useWritePostgateMutation().mutateAsync;
    var setThreadgateAllow = useSetThreadgateAllowMutation().mutateAsync;
    var _d = useState(), editedPostgate = _d[0], setEditedPostgate = _d[1];
    var _e = useState(), editedAllowUISettings = _e[0], setEditedAllowUISettings = _e[1];
    var isLoading = isLoadingThreadgate || isLoadingPostgate;
    var threadgateView = threadgateViewLoaded || props.initialThreadgateView;
    var isThreadgateOwnedByViewer = useMemo(function () {
        return (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === new AtUri(props.rootPostUri).host;
    }, [props.rootPostUri, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did]);
    var postgateValue = useMemo(function () {
        return (editedPostgate || postgate || createPostgateRecord({ post: props.postUri }));
    }, [postgate, editedPostgate, props.postUri]);
    var allowUIValue = useMemo(function () {
        return (editedAllowUISettings || threadgateViewToAllowUISetting(threadgateView));
    }, [threadgateView, editedAllowUISettings]);
    var onSave = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var requests, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!editedPostgate && !editedAllowUISettings) {
                        props.control.close();
                        return [2 /*return*/];
                    }
                    setIsSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    requests = [];
                    if (editedPostgate) {
                        requests.push(writePostgateRecord({
                            postUri: props.postUri,
                            postgate: editedPostgate,
                        }));
                    }
                    if (editedAllowUISettings && isThreadgateOwnedByViewer) {
                        requests.push(setThreadgateAllow({
                            postUri: props.rootPostUri,
                            allow: editedAllowUISettings,
                        }));
                    }
                    return [4 /*yield*/, Promise.all(requests)];
                case 2:
                    _a.sent();
                    props.control.close();
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    ax.logger.error("Failed to save post interaction settings", {
                        source: 'PostInteractionSettingsDialogControlledInner',
                        safeMessage: e_1.message,
                    });
                    Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["There was an issue. Please check your internet connection and try again."], ["There was an issue. Please check your internet connection and try again."])))), 'xmark');
                    return [3 /*break*/, 5];
                case 4:
                    setIsSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [
        _,
        ax,
        props.postUri,
        props.rootPostUri,
        props.control,
        editedPostgate,
        editedAllowUISettings,
        setIsSaving,
        writePostgateRecord,
        setThreadgateAllow,
        isThreadgateOwnedByViewer,
    ]);
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Edit post interaction settings"], ["Edit post interaction settings"])))), style: [web({ maxWidth: 400 }), a.w_full], children: [isLoading ? (_jsxs(View, { style: [
                    a.flex_1,
                    a.py_5xl,
                    a.gap_md,
                    a.align_center,
                    a.justify_center,
                ], children: [_jsx(Loader, { size: "xl" }), _jsx(Text, { style: [a.italic, a.text_center], children: _jsx(Trans, { children: "Loading post interaction settings..." }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Header, {}), _jsx(PostInteractionSettingsForm, { replySettingsDisabled: !isThreadgateOwnedByViewer, isSaving: isSaving, onSave: onSave, postgate: postgateValue, onChangePostgate: setEditedPostgate, threadgateAllowUISettings: allowUIValue, onChangeThreadgateAllowUISettings: setEditedAllowUISettings })] })), _jsx(Dialog.Close, {})] }));
}
export function PostInteractionSettingsForm(_a) {
    var _b = _a.canSave, canSave = _b === void 0 ? true : _b, onSave = _a.onSave, isSaving = _a.isSaving, postgate = _a.postgate, onChangePostgate = _a.onChangePostgate, threadgateAllowUISettings = _a.threadgateAllowUISettings, onChangeThreadgateAllowUISettings = _a.onChangeThreadgateAllowUISettings, replySettingsDisabled = _a.replySettingsDisabled, isDirty = _a.isDirty, persist = _a.persist, onChangePersist = _a.onChangePersist;
    var t = useTheme();
    var _ = useLingui()._;
    var playHaptic = useHaptics();
    var _c = useState(false), showLists = _c[0], setShowLists = _c[1];
    var _d = useMyListsQuery('curate'), lists = _d.data, isListsPending = _d.isPending, isListsError = _d.isError;
    var _e = useState(!(postgate.embeddingRules &&
        postgate.embeddingRules.find(function (v) { return v.$type === embeddingRules.disableRule.$type; }))), quotesEnabled = _e[0], setQuotesEnabled = _e[1];
    var onChangeQuotesEnabled = useCallback(function (enabled) {
        setQuotesEnabled(enabled);
        onChangePostgate(createPostgateRecord(__assign(__assign({}, postgate), { embeddingRules: enabled ? [] : [embeddingRules.disableRule] })));
    }, [setQuotesEnabled, postgate, onChangePostgate]);
    var noOneCanReply = !!threadgateAllowUISettings.find(function (v) { return v.type === 'nobody'; });
    var everyoneCanReply = !!threadgateAllowUISettings.find(function (v) { return v.type === 'everybody'; });
    var numberOfListsSelected = threadgateAllowUISettings.filter(function (v) { return v.type === 'list'; }).length;
    var toggleGroupValues = useMemo(function () {
        var values = [];
        for (var _i = 0, threadgateAllowUISettings_1 = threadgateAllowUISettings; _i < threadgateAllowUISettings_1.length; _i++) {
            var setting = threadgateAllowUISettings_1[_i];
            switch (setting.type) {
                case 'everybody':
                case 'nobody':
                    // no granularity, early return with nothing
                    return [];
                case 'followers':
                    values.push('followers');
                    break;
                case 'following':
                    values.push('following');
                    break;
                case 'mention':
                    values.push('mention');
                    break;
                case 'list':
                    values.push("list:".concat(setting.list));
                    break;
                default:
                    break;
            }
        }
        return values;
    }, [threadgateAllowUISettings]);
    var toggleGroupOnChange = function (values) {
        var settings = [];
        if (values.length === 0) {
            settings.push({ type: 'everybody' });
        }
        else {
            for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
                var value = values_1[_i];
                if (value.startsWith('list:')) {
                    var listId = value.slice('list:'.length);
                    settings.push({ type: 'list', list: listId });
                }
                else {
                    settings.push({ type: value });
                }
            }
        }
        onChangeThreadgateAllowUISettings(settings);
    };
    return (_jsxs(View, { style: [a.flex_1, a.gap_lg], children: [_jsxs(View, { style: [a.gap_lg], children: [replySettingsDisabled && (_jsxs(View, { style: [
                            a.px_md,
                            a.py_sm,
                            a.rounded_sm,
                            a.flex_row,
                            a.align_center,
                            a.gap_sm,
                            t.atoms.bg_contrast_25,
                        ], children: [_jsx(CircleInfo, { fill: t.atoms.text_contrast_low.color }), _jsx(Text, { style: [a.flex_1, a.leading_snug, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Reply settings are chosen by the author of the thread" }) })] })), _jsxs(View, { style: [a.gap_sm, { opacity: replySettingsDisabled ? 0.3 : 1 }], children: [_jsx(Text, { style: [a.text_md, a.font_medium], children: _jsx(Trans, { children: "Who can reply" }) }), _jsx(Toggle.Group, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Set who can reply to your post"], ["Set who can reply to your post"])))), type: "radio", maxSelections: 1, disabled: replySettingsDisabled, values: everyoneCanReply ? ['everyone'] : noOneCanReply ? ['nobody'] : [], onChange: function (val) {
                                    if (val.includes('everyone')) {
                                        onChangeThreadgateAllowUISettings([{ type: 'everybody' }]);
                                    }
                                    else if (val.includes('nobody')) {
                                        onChangeThreadgateAllowUISettings([{ type: 'nobody' }]);
                                    }
                                    else {
                                        onChangeThreadgateAllowUISettings([{ type: 'mention' }]);
                                    }
                                }, children: _jsxs(View, { style: [a.flex_row, a.gap_sm], children: [_jsx(Toggle.Item, { name: "everyone", type: "checkbox", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Allow anyone to reply"], ["Allow anyone to reply"])))), style: [a.flex_1], children: function (_a) {
                                                var selected = _a.selected;
                                                return (_jsxs(Toggle.Panel, { active: selected, children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.PanelText, { children: _jsx(Trans, { children: "Anyone" }) })] }));
                                            } }), _jsx(Toggle.Item, { name: "nobody", type: "checkbox", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Disable replies entirely"], ["Disable replies entirely"])))), style: [a.flex_1], children: function (_a) {
                                                var selected = _a.selected;
                                                return (_jsxs(Toggle.Panel, { active: selected, children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.PanelText, { children: _jsx(Trans, { children: "Nobody" }) })] }));
                                            } })] }) }), _jsx(Toggle.Group, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Set precisely which groups of people can reply to your post"], ["Set precisely which groups of people can reply to your post"])))), values: toggleGroupValues, onChange: toggleGroupOnChange, disabled: replySettingsDisabled, children: _jsxs(Toggle.PanelGroup, { children: [_jsx(Toggle.Item, { name: "followers", type: "checkbox", label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Allow your followers to reply"], ["Allow your followers to reply"])))), hitSlop: 0, children: function (_a) {
                                                var selected = _a.selected;
                                                return (_jsxs(Toggle.Panel, { active: selected, adjacent: "trailing", children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.PanelText, { children: _jsx(Trans, { children: "Your followers" }) })] }));
                                            } }), _jsx(Toggle.Item, { name: "following", type: "checkbox", label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Allow people you follow to reply"], ["Allow people you follow to reply"])))), hitSlop: 0, children: function (_a) {
                                                var selected = _a.selected;
                                                return (_jsxs(Toggle.Panel, { active: selected, adjacent: "both", children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.PanelText, { children: _jsx(Trans, { children: "People you follow" }) })] }));
                                            } }), _jsx(Toggle.Item, { name: "mention", type: "checkbox", label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Allow people you mention to reply"], ["Allow people you mention to reply"])))), hitSlop: 0, children: function (_a) {
                                                var selected = _a.selected;
                                                return (_jsxs(Toggle.Panel, { active: selected, adjacent: "both", children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.PanelText, { children: _jsx(Trans, { children: "People you mention" }) })] }));
                                            } }), _jsx(Button, { label: showLists
                                                ? _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Hide lists"], ["Hide lists"]))))
                                                : _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Show lists of users to select from"], ["Show lists of users to select from"])))), accessibilityRole: "togglebutton", hitSlop: 0, onPress: function () {
                                                playHaptic('Light');
                                                if (IS_IOS && !showLists) {
                                                    LayoutAnimation.configureNext(__assign(__assign({}, LayoutAnimation.Presets.linear), { duration: 175 }));
                                                }
                                                setShowLists(function (s) { return !s; });
                                            }, children: _jsxs(Toggle.Panel, { active: numberOfListsSelected > 0, adjacent: showLists ? 'both' : 'leading', children: [_jsx(Toggle.PanelText, { children: numberOfListsSelected === 0 ? (_jsx(Trans, { children: "Select from your lists" })) : (_jsxs(Trans, { children: ["Select from your lists", ' ', _jsx(NestedText, { style: [a.font_normal, a.italic], children: _jsx(Plural, { value: numberOfListsSelected, other: "(# selected)" }) })] })) }), _jsx(Toggle.PanelIcon, { icon: showLists ? ChevronUpIcon : ChevronDownIcon })] }) }), showLists &&
                                            (isListsPending ? (_jsx(Toggle.Panel, { children: _jsx(Toggle.PanelText, { children: _jsx(Trans, { children: "Loading lists..." }) }) })) : isListsError ? (_jsx(Toggle.Panel, { children: _jsx(Toggle.PanelText, { children: _jsx(Trans, { children: "An error occurred while loading your lists :/" }) }) })) : lists.length === 0 ? (_jsx(Toggle.Panel, { children: _jsx(Toggle.PanelText, { children: _jsx(Trans, { children: "You don't have any lists yet." }) }) })) : (lists.map(function (list, i) { return (_jsx(Toggle.Item, { name: "list:".concat(list.uri), type: "checkbox", label: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Allow users in ", " to reply"], ["Allow users in ", " to reply"])), list.name)), hitSlop: 0, children: function (_a) {
                                                    var selected = _a.selected;
                                                    return (_jsxs(Toggle.Panel, { active: selected, adjacent: i === lists.length - 1 ? 'leading' : 'both', children: [_jsx(Toggle.Checkbox, {}), _jsx(UserAvatar, { size: 24, type: "list", avatar: list.avatar }), _jsx(Toggle.PanelText, { children: list.name })] }));
                                                } }, list.uri)); })))] }) })] })] }), _jsx(Toggle.Item, { name: "quoteposts", type: "checkbox", label: quotesEnabled
                    ? _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Disable quote posts of this post"], ["Disable quote posts of this post"]))))
                    : _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Enable quote posts of this post"], ["Enable quote posts of this post"])))), value: quotesEnabled, onChange: onChangeQuotesEnabled, children: function (_a) {
                    var selected = _a.selected;
                    return (_jsxs(Toggle.Panel, { active: selected, children: [_jsx(Toggle.PanelText, { icon: QuoteIcon, children: _jsx(Trans, { children: "Allow quote posts" }) }), _jsx(Toggle.Switch, {})] }));
                } }), typeof persist !== 'undefined' && (_jsx(View, { style: [{ minHeight: 24 }, a.justify_center], children: isDirty ? (_jsxs(Toggle.Item, { name: "persist", type: "checkbox", label: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Save these options for next time"], ["Save these options for next time"])))), value: persist, onChange: function () { return onChangePersist === null || onChangePersist === void 0 ? void 0 : onChangePersist(!persist); }, children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { style: [a.text_md, a.font_normal, t.atoms.text], children: _jsx(Trans, { children: "Save these options for next time" }) })] })) : (_jsx(Text, { style: [a.text_md, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "These are your default settings" }) })) })), _jsxs(Button, { disabled: !canSave || isSaving, label: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Save"], ["Save"])))), onPress: onSave, color: "primary", size: "large", children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Save" }) }), isSaving && _jsx(ButtonIcon, { icon: Loader })] })] }));
}
function Header() {
    return (_jsx(View, { style: [a.pb_lg], children: _jsx(Text, { style: [a.text_2xl, a.font_bold], children: _jsx(Trans, { children: "Post interaction settings" }) }) }));
}
export function usePrefetchPostInteractionSettings(_a) {
    var _this = this;
    var postUri = _a.postUri, rootPostUri = _a.rootPostUri;
    var ax = useAnalytics();
    var queryClient = useQueryClient();
    var agent = useAgent();
    var getPost = useGetPost();
    return useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var e_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([
                            queryClient.prefetchQuery({
                                queryKey: createPostgateQueryKey(postUri),
                                queryFn: function () {
                                    return getPostgateRecord({ agent: agent, postUri: postUri }).then(function (res) { return res !== null && res !== void 0 ? res : null; });
                                },
                                staleTime: STALE.SECONDS.THIRTY,
                            }),
                            queryClient.prefetchQuery({
                                queryKey: createThreadgateViewQueryKey(rootPostUri),
                                queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                                    var post;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, getPost({ uri: rootPostUri })];
                                            case 1:
                                                post = _b.sent();
                                                return [2 /*return*/, (_a = post.threadgate) !== null && _a !== void 0 ? _a : null];
                                        }
                                    });
                                }); },
                                staleTime: STALE.SECONDS.THIRTY,
                            }),
                        ])];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_2 = _a.sent();
                    ax.logger.error("Failed to prefetch post interaction settings", {
                        safeMessage: e_2.message,
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, [ax, queryClient, agent, postUri, rootPostUri, getPost]);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17;
