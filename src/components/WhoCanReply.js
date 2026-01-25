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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useMemo, useRef } from 'react';
import { Keyboard, Platform, View, } from 'react-native';
import { AppBskyFeedPost, AtUri, } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { HITSLOP_10 } from '#/lib/constants';
import { makeListLink, makeProfileLink } from '#/lib/routes/links';
import { threadgateViewToAllowUISetting, } from '#/state/queries/threadgate';
import { atoms as a, native, useTheme, web } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useDialogControl } from '#/components/Dialog';
import { PostInteractionSettingsDialog, usePrefetchPostInteractionSettings, } from '#/components/dialogs/PostInteractionSettingsDialog';
import { TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronDownIcon } from '#/components/icons/Chevron';
import { CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSignIcon } from '#/components/icons/CircleBanSign';
import { Earth_Stroke2_Corner0_Rounded as EarthIcon } from '#/components/icons/Globe';
import { Group3_Stroke2_Corner0_Rounded as GroupIcon } from '#/components/icons/Group';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
import * as bsky from '#/types/bsky';
export function WhoCanReply(_a) {
    var _b, _c;
    var post = _a.post, isThreadAuthor = _a.isThreadAuthor, style = _a.style;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var infoDialogControl = useDialogControl();
    var editDialogControl = useDialogControl();
    /*
     * `WhoCanReply` is only used for root posts atm, in case this changes
     * unexpectedly, we should check to make sure it's for sure the root URI.
     */
    var rootUri = bsky.dangerousIsType(post.record, AppBskyFeedPost.isRecord) && ((_b = post.record.reply) === null || _b === void 0 ? void 0 : _b.root)
        ? post.record.reply.root.uri
        : post.uri;
    var settings = useMemo(function () {
        return threadgateViewToAllowUISetting(post.threadgate);
    }, [post.threadgate]);
    var prefetchPostInteractionSettings = usePrefetchPostInteractionSettings({
        postUri: post.uri,
        rootPostUri: rootUri,
    });
    var prefetchPromise = useRef(Promise.resolve());
    var prefetch = function () {
        prefetchPromise.current = prefetchPostInteractionSettings();
    };
    var anyoneCanReply = settings.length === 1 && settings[0].type === 'everybody';
    var noOneCanReply = settings.length === 1 && settings[0].type === 'nobody';
    var description = anyoneCanReply
        ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Everybody can reply"], ["Everybody can reply"]))))
        : noOneCanReply
            ? _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Replies disabled"], ["Replies disabled"]))))
            : _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Some people can reply"], ["Some people can reply"]))));
    var onPressOpen = function () {
        if (IS_NATIVE && Keyboard.isVisible()) {
            Keyboard.dismiss();
        }
        if (isThreadAuthor) {
            ax.metric('thread:click:editOwnThreadgate', {});
            // wait on prefetch if it manages to resolve in under 200ms
            // otherwise, proceed immediately and show the spinner -sfn
            Promise.race([
                prefetchPromise.current,
                new Promise(function (res) { return setTimeout(res, 200); }),
            ]).finally(function () {
                editDialogControl.open();
            });
        }
        else {
            ax.metric('thread:click:viewSomeoneElsesThreadgate', {});
            infoDialogControl.open();
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(Button, __assign({ label: isThreadAuthor ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Edit who can reply"], ["Edit who can reply"])))) : _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Who can reply"], ["Who can reply"])))), onPress: onPressOpen }, (isThreadAuthor
                ? Platform.select({
                    web: {
                        onHoverIn: prefetch,
                    },
                    native: {
                        onPressIn: prefetch,
                    },
                })
                : {}), { hitSlop: HITSLOP_10, children: function (_a) {
                    var hovered = _a.hovered, focused = _a.focused, pressed = _a.pressed;
                    return (_jsxs(View, { style: [
                            a.flex_row,
                            a.align_center,
                            a.gap_xs,
                            (hovered || focused || pressed) && native({ opacity: 0.5 }),
                            style,
                        ], children: [_jsx(Icon, { color: isThreadAuthor ? t.palette.primary_500 : t.palette.contrast_400, width: 16, settings: settings }), _jsx(Text, { style: [
                                    a.text_sm,
                                    a.leading_tight,
                                    isThreadAuthor
                                        ? { color: t.palette.primary_500 }
                                        : t.atoms.text_contrast_medium,
                                    (hovered || focused || pressed) && web(a.underline),
                                ], children: description }), isThreadAuthor && (_jsx(TinyChevronDownIcon, { width: 8, fill: t.palette.primary_500 }))] }));
                } })), isThreadAuthor ? (_jsx(PostInteractionSettingsDialog, { postUri: post.uri, rootPostUri: rootUri, control: editDialogControl, initialThreadgateView: post.threadgate })) : (_jsx(WhoCanReplyDialog, { control: infoDialogControl, post: post, settings: settings, embeddingDisabled: Boolean((_c = post.viewer) === null || _c === void 0 ? void 0 : _c.embeddingDisabled) }))] }));
}
function Icon(_a) {
    var color = _a.color, width = _a.width, settings = _a.settings;
    var isEverybody = settings.length === 0 ||
        settings.every(function (setting) { return setting.type === 'everybody'; });
    var isNobody = !!settings.find(function (gate) { return gate.type === 'nobody'; });
    var IconComponent = isEverybody
        ? EarthIcon
        : isNobody
            ? CircleBanSignIcon
            : GroupIcon;
    return _jsx(IconComponent, { fill: color, width: width });
}
function WhoCanReplyDialog(_a) {
    var control = _a.control, post = _a.post, settings = _a.settings, embeddingDisabled = _a.embeddingDisabled;
    var _ = useLingui()._;
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Dialog: adjust who can interact with this post"], ["Dialog: adjust who can interact with this post"])))), style: web({ maxWidth: 400 }), children: [_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.font_semi_bold, a.text_xl, a.pb_sm], children: _jsx(Trans, { children: "Who can interact with this post?" }) }), _jsx(Rules, { post: post, settings: settings, embeddingDisabled: embeddingDisabled })] }), IS_NATIVE && (_jsx(Button, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Close"], ["Close"])))), onPress: function () { return control.close(); }, size: "small", variant: "solid", color: "secondary", style: [a.mt_5xl], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) })), _jsx(Dialog.Close, {})] })] }));
}
function Rules(_a) {
    var post = _a.post, settings = _a.settings, embeddingDisabled = _a.embeddingDisabled;
    var t = useTheme();
    return (_jsxs(_Fragment, { children: [_jsxs(Text, { style: [
                    a.text_sm,
                    a.leading_snug,
                    a.flex_wrap,
                    t.atoms.text_contrast_medium,
                ], children: [settings.length === 0 ? (_jsx(Trans, { children: "This post has an unknown type of threadgate on it. Your app may be out of date." })) : settings[0].type === 'everybody' ? (_jsx(Trans, { children: "Everybody can reply to this post." })) : settings[0].type === 'nobody' ? (_jsx(Trans, { children: "Replies to this post are disabled." })) : (_jsxs(Trans, { children: ["Only", ' ', settings.map(function (rule, i) { return (_jsxs(Fragment, { children: [_jsx(Rule, { rule: rule, post: post, lists: post.threadgate.lists }), _jsx(Separator, { i: i, length: settings.length })] }, "rule-".concat(i))); }), ' ', "can reply."] })), ' '] }), embeddingDisabled && (_jsx(Text, { style: [
                    a.text_sm,
                    a.leading_snug,
                    a.flex_wrap,
                    t.atoms.text_contrast_medium,
                ], children: _jsx(Trans, { children: "No one but the author can quote this post." }) }))] }));
}
function Rule(_a) {
    var rule = _a.rule, post = _a.post, lists = _a.lists;
    if (rule.type === 'mention') {
        return _jsx(Trans, { children: "mentioned users" });
    }
    if (rule.type === 'followers') {
        return (_jsxs(Trans, { children: ["users following", ' ', _jsxs(InlineLinkText, { label: "@".concat(post.author.handle), to: makeProfileLink(post.author), style: [a.text_sm, a.leading_snug], children: ["@", post.author.handle] })] }));
    }
    if (rule.type === 'following') {
        return (_jsxs(Trans, { children: ["users followed by", ' ', _jsxs(InlineLinkText, { label: "@".concat(post.author.handle), to: makeProfileLink(post.author), style: [a.text_sm, a.leading_snug], children: ["@", post.author.handle] })] }));
    }
    if (rule.type === 'list') {
        var list = lists === null || lists === void 0 ? void 0 : lists.find(function (l) { return l.uri === rule.list; });
        if (list) {
            var listUrip = new AtUri(list.uri);
            return (_jsxs(Trans, { children: [_jsx(InlineLinkText, { label: list.name, to: makeListLink(listUrip.hostname, listUrip.rkey), style: [a.text_sm, a.leading_snug], children: list.name }), ' ', "members"] }));
        }
    }
}
function Separator(_a) {
    var i = _a.i, length = _a.length;
    if (length < 2 || i === length - 1) {
        return null;
    }
    if (i === length - 2) {
        return (_jsxs(_Fragment, { children: [length > 2 ? ',' : '', " ", _jsx(Trans, { children: "and" }), ' '] }));
    }
    return _jsx(_Fragment, { children: ", " });
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
