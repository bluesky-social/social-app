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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient, } from '@tanstack/react-query';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { cleanError } from '#/lib/strings/errors';
import { sanitizeHandle } from '#/lib/strings/handles';
import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { RQKEY_getActivitySubscriptions } from '#/state/queries/activity-subscriptions';
import { useAgent } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, platform, useTheme, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText, } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as Toggle from '#/components/forms/Toggle';
import { Loader } from '#/components/Loader';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
export function SubscribeProfileDialog(_a) {
    var control = _a.control, profile = _a.profile, moderationOpts = _a.moderationOpts, includeProfile = _a.includeProfile;
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, { profile: profile, moderationOpts: moderationOpts, includeProfile: includeProfile })] }));
}
function DialogInner(_a) {
    var _this = this;
    var _b;
    var profile = _a.profile, moderationOpts = _a.moderationOpts, includeProfile = _a.includeProfile;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var t = useTheme();
    var agent = useAgent();
    var control = Dialog.useDialogContext();
    var queryClient = useQueryClient();
    var initialState = parseActivitySubscription((_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.activitySubscription);
    var _c = useState(initialState), state = _c[0], setState = _c[1];
    var values = useMemo(function () {
        var post = state.post, reply = state.reply;
        var res = [];
        if (post)
            res.push('post');
        if (reply)
            res.push('reply');
        return res;
    }, [state]);
    var onChange = function (newValues) {
        setState(function (oldValues) {
            // ensure you can't have reply without post
            if (!oldValues.reply && newValues.includes('reply')) {
                return {
                    post: true,
                    reply: true,
                };
            }
            if (oldValues.post && !newValues.includes('post')) {
                return {
                    post: false,
                    reply: false,
                };
            }
            return {
                post: newValues.includes('post'),
                reply: newValues.includes('reply'),
            };
        });
    };
    var _d = useMutation({
        mutationFn: function (activitySubscription) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.notification.putActivitySubscription({
                            subject: profile.did,
                            activitySubscription: activitySubscription,
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (_data, activitySubscription) {
            control.close(function () {
                updateProfileShadow(queryClient, profile.did, {
                    activitySubscription: activitySubscription,
                });
                if (!activitySubscription.post && !activitySubscription.reply) {
                    ax.metric('activitySubscription:disable', {});
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You will no longer receive notifications for ", ""], ["You will no longer receive notifications for ", ""])), sanitizeHandle(profile.handle, '@'))), 'check');
                    // filter out the subscription
                    queryClient.setQueryData(RQKEY_getActivitySubscriptions, function (old) {
                        if (!old)
                            return old;
                        return __assign(__assign({}, old), { pages: old.pages.map(function (page) { return (__assign(__assign({}, page), { subscriptions: page.subscriptions.filter(function (item) { return item.did !== profile.did; }) })); }) });
                    });
                }
                else {
                    ax.metric('activitySubscription:enable', {
                        setting: activitySubscription.reply ? 'posts_and_replies' : 'posts',
                    });
                    if (!initialState.post && !initialState.reply) {
                        Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["You'll start receiving notifications for ", "!"], ["You'll start receiving notifications for ", "!"])), sanitizeHandle(profile.handle, '@'))), 'check');
                    }
                    else {
                        Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Changes saved"], ["Changes saved"])))), 'check');
                    }
                }
            });
        },
        onError: function (err) {
            ax.logger.error('Could not save activity subscription', { message: err });
        },
    }), saveChanges = _d.mutate, isSaving = _d.isPending, error = _d.error;
    var buttonProps = useMemo(function () {
        var isDirty = state.post !== initialState.post || state.reply !== initialState.reply;
        var hasAny = state.post || state.reply;
        if (isDirty) {
            return {
                label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Save changes"], ["Save changes"])))),
                color: hasAny ? 'primary' : 'negative',
                onPress: function () { return saveChanges(state); },
                disabled: isSaving,
            };
        }
        else {
            // on web, a disabled save button feels more natural than a massive close button
            if (IS_WEB) {
                return {
                    label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Save changes"], ["Save changes"])))),
                    color: 'secondary',
                    disabled: true,
                };
            }
            else {
                return {
                    label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Cancel"], ["Cancel"])))),
                    color: 'secondary',
                    onPress: function () { return control.close(); },
                };
            }
        }
    }, [state, initialState, control, _, isSaving, saveChanges]);
    var name = createSanitizedDisplayName(profile, false);
    return (_jsxs(Dialog.ScrollableInner, { style: web({ maxWidth: 400 }), label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Get notified of new posts from ", ""], ["Get notified of new posts from ", ""])), name)), children: [_jsxs(View, { style: [a.gap_lg], children: [_jsxs(View, { style: [a.gap_xs], children: [_jsx(Text, { style: [a.font_bold, a.text_2xl], children: _jsx(Trans, { children: "Keep me posted" }) }), _jsx(Text, { style: [t.atoms.text_contrast_medium, a.text_md], children: _jsx(Trans, { children: "Get notified of this account\u2019s activity" }) })] }), includeProfile && (_jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts, disabledPreview: true }), _jsx(ProfileCard.NameAndHandle, { profile: profile, moderationOpts: moderationOpts })] })), _jsx(Toggle.Group, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Subscribe to account activity"], ["Subscribe to account activity"])))), values: values, onChange: onChange, children: _jsxs(View, { style: [a.gap_sm], children: [_jsxs(Toggle.Item, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Posts"], ["Posts"])))), name: "post", style: [
                                        a.flex_1,
                                        a.py_xs,
                                        platform({
                                            native: [a.justify_between],
                                            web: [a.flex_row_reverse, a.gap_sm],
                                        }),
                                    ], children: [_jsx(Toggle.LabelText, { style: [t.atoms.text, a.font_normal, a.text_md, a.flex_1], children: _jsx(Trans, { children: "Posts" }) }), _jsx(Toggle.Switch, {})] }), _jsxs(Toggle.Item, { label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Replies"], ["Replies"])))), name: "reply", style: [
                                        a.flex_1,
                                        a.py_xs,
                                        platform({
                                            native: [a.justify_between],
                                            web: [a.flex_row_reverse, a.gap_sm],
                                        }),
                                    ], children: [_jsx(Toggle.LabelText, { style: [t.atoms.text, a.font_normal, a.text_md, a.flex_1], children: _jsx(Trans, { children: "Replies" }) }), _jsx(Toggle.Switch, {})] })] }) }), error && (_jsx(Admonition, { type: "error", children: _jsxs(Trans, { children: ["Could not save changes: ", cleanError(error)] }) })), _jsxs(Button, __assign({}, buttonProps, { size: "large", variant: "solid", children: [_jsx(ButtonText, { children: buttonProps.label }), isSaving && _jsx(ButtonIcon, { icon: Loader })] }))] }), _jsx(Dialog.Close, {})] }));
}
function parseActivitySubscription(sub) {
    if (!sub)
        return { post: false, reply: false };
    var post = sub.post, reply = sub.reply;
    return { post: post, reply: reply };
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;
