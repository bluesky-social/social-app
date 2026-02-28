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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { AtUri, moderateUserList, } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { precacheList } from '#/state/queries/feed';
import { useSession } from '#/state/session';
import { atoms as a, useTheme } from '#/alf';
import { Avatar, Description, Header, Outer, SaveButton, } from '#/components/FeedCard';
import { Link as InternalLink } from '#/components/Link';
import * as Hider from '#/components/moderation/Hider';
import { Text } from '#/components/Typography';
/*
 * This component is based on `FeedCard` and is tightly coupled with that
 * component. Please refer to `FeedCard` for more context.
 */
export { Avatar, AvatarPlaceholder, Description, Header, Outer, SaveButton, TitleAndBylinePlaceholder, } from '#/components/FeedCard';
var CURATELIST = 'app.bsky.graph.defs#curatelist';
var MODLIST = 'app.bsky.graph.defs#modlist';
export function Default(props) {
    var view = props.view, showPinButton = props.showPinButton;
    var moderationOpts = useModerationOpts();
    var moderation = moderationOpts
        ? moderateUserList(view, moderationOpts)
        : undefined;
    return (_jsx(Link, __assign({}, props, { children: _jsxs(Outer, { children: [_jsxs(Header, { children: [_jsx(Avatar, { src: view.avatar }), _jsx(TitleAndByline, { title: view.name, creator: view.creator, purpose: view.purpose, modUi: moderation === null || moderation === void 0 ? void 0 : moderation.ui('contentView') }), showPinButton && view.purpose === CURATELIST && (_jsx(SaveButton, { view: view, pin: true }))] }), _jsx(Description, { description: view.description })] }) })));
}
export function Link(_a) {
    var view = _a.view, children = _a.children, props = __rest(_a, ["view", "children"]);
    var queryClient = useQueryClient();
    var href = React.useMemo(function () {
        return createProfileListHref({ list: view });
    }, [view]);
    React.useEffect(function () {
        precacheList(queryClient, view);
    }, [view, queryClient]);
    return (_jsx(InternalLink, __assign({ label: view.name, to: href }, props, { children: children })));
}
export function TitleAndByline(_a) {
    var title = _a.title, creator = _a.creator, _b = _a.purpose, purpose = _b === void 0 ? CURATELIST : _b, modUi = _a.modUi;
    var t = useTheme();
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    return (_jsxs(View, { style: [a.flex_1], children: [_jsxs(Hider.Outer, { modui: modUi, isContentVisibleInitialState: creator && (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === creator.did, allowOverride: creator && (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === creator.did, children: [_jsx(Hider.Mask, { children: _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug, a.italic], numberOfLines: 1, children: _jsx(Trans, { children: "Hidden list" }) }) }), _jsx(Hider.Content, { children: _jsx(Text, { emoji: true, style: [a.text_md, a.font_semi_bold, a.leading_snug], numberOfLines: 1, children: title }) })] }), creator && (_jsx(Text, { emoji: true, style: [a.leading_snug, t.atoms.text_contrast_medium], numberOfLines: 1, children: purpose === MODLIST
                    ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Moderation list by ", ""], ["Moderation list by ", ""])), sanitizeHandle(creator.handle, '@')))
                    : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["List by ", ""], ["List by ", ""])), sanitizeHandle(creator.handle, '@'))) }))] }));
}
export function createProfileListHref(_a) {
    var list = _a.list;
    var urip = new AtUri(list.uri);
    var handleOrDid = list.creator.handle || list.creator.did;
    return "/profile/".concat(handleOrDid, "/lists/").concat(urip.rkey);
}
var templateObject_1, templateObject_2;
