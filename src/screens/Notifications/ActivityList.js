var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { PostFeed } from '#/view/com/posts/PostFeed';
import { EmptyState } from '#/view/com/util/EmptyState';
import { EditBig_Stroke1_Corner0_Rounded as EditIcon } from '#/components/icons/EditBig';
import * as Layout from '#/components/Layout';
import { ListFooter } from '#/components/Lists';
export function NotificationsActivityListScreen(_a) {
    var posts = _a.route.params.posts;
    var uris = decodeURIComponent(posts);
    var _ = useLingui()._;
    return (_jsxs(Layout.Screen, { testID: "NotificationsActivityListScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Notifications" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(PostFeed, { feed: "posts|".concat(uris), disablePoll: true, renderEmptyState: function () { return (_jsx(EmptyState, { icon: EditIcon, iconSize: "2xl", message: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["No posts here"], ["No posts here"])))) })); }, renderEndOfFeed: function () { return _jsx(ListFooter, {}); } })] }));
}
var templateObject_1;
