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
import { memo, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AtUri } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { EMBED_SCRIPT } from '#/lib/constants';
import { niceDate } from '#/lib/strings/time';
import { toShareUrl } from '#/lib/strings/url-helpers';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as SegmentedControl from '#/components/forms/SegmentedControl';
import * as TextField from '#/components/forms/TextField';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon, ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon, } from '#/components/icons/Chevron';
import { CodeBrackets_Stroke2_Corner0_Rounded as CodeBracketsIcon } from '#/components/icons/CodeBrackets';
import { Text } from '#/components/Typography';
var EmbedDialog = function (_a) {
    var control = _a.control, rest = __rest(_a, ["control"]);
    return (_jsxs(Dialog.Outer, { control: control, children: [_jsx(Dialog.Handle, {}), _jsx(EmbedDialogInner, __assign({}, rest))] }));
};
EmbedDialog = memo(EmbedDialog);
export { EmbedDialog };
function EmbedDialogInner(_a) {
    var postAuthor = _a.postAuthor, postCid = _a.postCid, postUri = _a.postUri, record = _a.record, timestamp = _a.timestamp;
    var t = useTheme();
    var _b = useLingui(), _ = _b._, i18n = _b.i18n;
    var _c = useState(false), copied = _c[0], setCopied = _c[1];
    var _d = useState(false), showCustomisation = _d[0], setShowCustomisation = _d[1];
    var _e = useState('system'), colorMode = _e[0], setColorMode = _e[1];
    // reset copied state after 2 seconds
    useEffect(function () {
        if (copied) {
            var timeout_1 = setTimeout(function () {
                setCopied(false);
            }, 2000);
            return function () { return clearTimeout(timeout_1); };
        }
    }, [copied]);
    var snippet = useMemo(function () {
        function toEmbedUrl(href) {
            return toShareUrl(href) + '?ref_src=embed';
        }
        var lang = record.langs && record.langs.length > 0 ? record.langs[0] : '';
        var profileHref = toEmbedUrl(['/profile', postAuthor.did].join('/'));
        var urip = new AtUri(postUri);
        var href = toEmbedUrl(['/profile', postAuthor.did, 'post', urip.rkey].join('/'));
        // x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x
        // DO NOT ADD ANY NEW INTERPOLATIONS BELOW WITHOUT ESCAPING THEM!
        // Also, keep this code synced with the bskyembed code in landing.tsx.
        // x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x
        return "<blockquote class=\"bluesky-embed\" data-bluesky-uri=\"".concat(escapeHtml(postUri), "\" data-bluesky-cid=\"").concat(escapeHtml(postCid), "\" data-bluesky-embed-color-mode=\"").concat(escapeHtml(colorMode), "\"><p lang=\"").concat(escapeHtml(lang), "\">").concat(escapeHtml(record.text)).concat(record.embed
            ? "<br><br><a href=\"".concat(escapeHtml(href), "\">[image or embed]</a>")
            : '', "</p>&mdash; ").concat(escapeHtml(postAuthor.displayName || postAuthor.handle), " (<a href=\"").concat(escapeHtml(profileHref), "\">@").concat(escapeHtml(postAuthor.handle), "</a>) <a href=\"").concat(escapeHtml(href), "\">").concat(escapeHtml(niceDate(i18n, timestamp)), "</a></blockquote><script async src=\"").concat(EMBED_SCRIPT, "\" charset=\"utf-8\"></script>");
    }, [i18n, postUri, postCid, record, timestamp, postAuthor, colorMode]);
    return (_jsxs(Dialog.Inner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Embed post"], ["Embed post"])))), style: [{ maxWidth: 500 }], children: [_jsxs(View, { style: [a.gap_lg], children: [_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.text_2xl, a.font_bold], children: _jsx(Trans, { children: "Embed post" }) }), _jsx(Text, { style: [a.text_md, t.atoms.text_contrast_medium, a.leading_normal], children: _jsx(Trans, { children: "Embed this post in your website. Simply copy the following snippet and paste it into the HTML code of your website." }) })] }), _jsxs(View, { style: [
                            a.border,
                            t.atoms.border_contrast_low,
                            a.rounded_sm,
                            a.overflow_hidden,
                        ], children: [_jsxs(Button, { label: showCustomisation
                                    ? _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Hide customization options"], ["Hide customization options"]))))
                                    : _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Show customization options"], ["Show customization options"])))), color: "secondary", variant: "ghost", size: "small", shape: "default", onPress: function () { return setShowCustomisation(function (c) { return !c; }); }, style: [
                                    a.justify_start,
                                    showCustomisation && t.atoms.bg_contrast_25,
                                ], children: [_jsx(ButtonIcon, { icon: showCustomisation ? ChevronBottomIcon : ChevronRightIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Customization options" }) })] }), showCustomisation && (_jsxs(View, { style: [a.gap_sm, a.p_md], children: [_jsx(Text, { style: [t.atoms.text_contrast_medium, a.font_semi_bold], children: _jsx(Trans, { children: "Color theme" }) }), _jsxs(SegmentedControl.Root, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Color mode"], ["Color mode"])))), type: "radio", value: colorMode, onChange: setColorMode, children: [_jsx(SegmentedControl.Item, { value: "system", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["System"], ["System"])))), children: _jsx(SegmentedControl.ItemText, { children: _jsx(Trans, { children: "System" }) }) }), _jsx(SegmentedControl.Item, { value: "light", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Light"], ["Light"])))), children: _jsx(SegmentedControl.ItemText, { children: _jsx(Trans, { children: "Light" }) }) }), _jsx(SegmentedControl.Item, { value: "dark", label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Dark"], ["Dark"])))), children: _jsx(SegmentedControl.ItemText, { children: _jsx(Trans, { children: "Dark" }) }) })] })] }))] }), _jsxs(View, { style: [a.flex_row, a.gap_sm], children: [_jsx(View, { style: [a.flex_1], children: _jsxs(TextField.Root, { children: [_jsx(TextField.Icon, { icon: CodeBracketsIcon }), _jsx(TextField.Input, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Embed HTML code"], ["Embed HTML code"])))), editable: false, selection: { start: 0, end: snippet.length }, value: snippet })] }) }), _jsx(Button, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Copy code"], ["Copy code"])))), color: "primary", variant: "solid", size: "large", onPress: function () {
                                    navigator.clipboard.writeText(snippet);
                                    setCopied(true);
                                }, children: copied ? (_jsxs(_Fragment, { children: [_jsx(ButtonIcon, { icon: CheckIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Copied!" }) })] })) : (_jsx(ButtonText, { children: _jsx(Trans, { children: "Copy code" }) })) })] })] }), _jsx(Dialog.Close, {})] }));
}
/**
 * Based on a snippet of code from React, which itself was based on the escape-html library.
 * Copyright (c) Meta Platforms, Inc. and affiliates
 * Copyright (c) 2012-2013 TJ Holowaychuk
 * Copyright (c) 2015 Andreas Lubbe
 * Copyright (c) 2015 Tiancheng "Timothy" Gu
 * Licensed as MIT.
 */
var matchHtmlRegExp = /["'&<>]/;
function escapeHtml(string) {
    var str = String(string);
    var match = matchHtmlRegExp.exec(str);
    if (!match) {
        return str;
    }
    var escape;
    var html = '';
    var index;
    var lastIndex = 0;
    for (index = match.index; index < str.length; index++) {
        switch (str.charCodeAt(index)) {
            case 34: // "
                escape = '&quot;';
                break;
            case 38: // &
                escape = '&amp;';
                break;
            case 39: // '
                escape = '&#x27;';
                break;
            case 60: // <
                escape = '&lt;';
                break;
            case 62: // >
                escape = '&gt;';
                break;
            default:
                continue;
        }
        if (lastIndex !== index) {
            html += str.slice(lastIndex, index);
        }
        lastIndex = index + 1;
        html += escape;
    }
    return lastIndex !== index ? html + str.slice(lastIndex, index) : html;
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
