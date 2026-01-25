var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { AppBskyGraphStarterpack, moderateProfile, } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';
import { LoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useBreakpoints, useTheme, web } from '#/alf';
import { ButtonText } from '#/components/Button';
import { PlusSmall_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Link } from '#/components/Link';
import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import { useStarterPackLink } from '#/components/StarterPack/StarterPackCard';
import { SubtleHover } from '#/components/SubtleHover';
import { Text } from '#/components/Typography';
import * as bsky from '#/types/bsky';
export function StarterPackCard(_a) {
    var _b;
    var view = _a.view;
    var t = useTheme();
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var gtPhone = useBreakpoints().gtPhone;
    var link = useStarterPackLink({ view: view });
    var record = view.record;
    if (!bsky.dangerousIsType(record, AppBskyGraphStarterpack.isRecord)) {
        return null;
    }
    var profileCount = gtPhone ? 11 : 8;
    var profiles = (_b = view.listItemsSample) === null || _b === void 0 ? void 0 : _b.slice(0, profileCount).map(function (item) { return item.subject; });
    return (_jsx(Link, { to: link.to, label: link.label, onHoverIn: link.precache, onPress: link.precache, children: function (s) {
            var _a, _b;
            return (_jsxs(_Fragment, { children: [_jsx(SubtleHover, { hover: s.hovered || s.pressed }), _jsxs(View, { style: [
                            a.w_full,
                            a.p_lg,
                            a.gap_md,
                            a.border,
                            a.rounded_sm,
                            a.overflow_hidden,
                            t.atoms.border_contrast_low,
                        ], children: [_jsx(AvatarStack, { profiles: profiles !== null && profiles !== void 0 ? profiles : [], numPending: profileCount, total: (_a = view.list) === null || _a === void 0 ? void 0 : _a.listItemCount }), _jsxs(View, { style: [
                                    a.w_full,
                                    a.flex_row,
                                    a.align_start,
                                    a.gap_lg,
                                    web({
                                        position: 'static',
                                        zIndex: 'unset',
                                    }),
                                ], children: [_jsxs(View, { style: [a.flex_1], children: [_jsx(Text, { emoji: true, style: [a.text_md, a.font_semi_bold, a.leading_snug], numberOfLines: 1, children: record.name }), _jsx(Text, { emoji: true, style: [
                                                    a.text_sm,
                                                    a.leading_snug,
                                                    t.atoms.text_contrast_medium,
                                                ], numberOfLines: 1, children: ((_b = view.creator) === null || _b === void 0 ? void 0 : _b.did) === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)
                                                    ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["By you"], ["By you"]))))
                                                    : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["By ", ""], ["By ", ""])), sanitizeHandle(view.creator.handle, '@'))) })] }), _jsx(Link, { to: link.to, label: link.label, onHoverIn: link.precache, onPress: link.precache, variant: "solid", color: "secondary", size: "small", style: [a.z_50], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Open pack" }) }) })] })] })] }));
        } }));
}
export function AvatarStack(_a) {
    var profiles = _a.profiles, numPending = _a.numPending, total = _a.total;
    var t = useTheme();
    var gtPhone = useBreakpoints().gtPhone;
    var moderationOpts = useModerationOpts();
    var computedTotal = (total !== null && total !== void 0 ? total : numPending) - numPending;
    var circlesCount = numPending + 1; // add total at end
    var widthPerc = 100 / circlesCount;
    var _b = React.useState(null), size = _b[0], setSize = _b[1];
    var isPending = (numPending && profiles.length === 0) || !moderationOpts;
    var items = isPending
        ? Array.from({ length: numPending !== null && numPending !== void 0 ? numPending : circlesCount }).map(function (_, i) { return ({
            key: i,
            profile: null,
            moderation: null,
        }); })
        : profiles.map(function (item) { return ({
            key: item.did,
            profile: item,
            moderation: moderateProfile(item, moderationOpts),
        }); });
    return (_jsxs(View, { style: [
            a.w_full,
            a.flex_row,
            a.align_center,
            a.relative,
            { width: "".concat(100 - widthPerc * 0.2, "%") },
        ], children: [items.map(function (item, i) {
                var _a;
                return (_jsx(View, { style: [
                        {
                            width: "".concat(widthPerc, "%"),
                            zIndex: 100 - i,
                        },
                    ], children: _jsx(View, { style: [
                            a.relative,
                            {
                                width: '120%',
                            },
                        ], children: _jsx(View, { onLayout: function (e) { return setSize(e.nativeEvent.layout.width); }, style: [
                                a.rounded_full,
                                t.atoms.bg_contrast_25,
                                {
                                    paddingTop: '100%',
                                },
                            ], children: size && item.profile ? (_jsx(UserAvatar, { size: size, avatar: item.profile.avatar, type: ((_a = item.profile.associated) === null || _a === void 0 ? void 0 : _a.labeler) ? 'labeler' : 'user', moderation: item.moderation.ui('avatar'), style: [a.absolute, a.inset_0] })) : (_jsx(MediaInsetBorder, { style: [a.rounded_full] })) }) }) }, item.key));
            }), _jsx(View, { style: [
                    {
                        width: "".concat(widthPerc, "%"),
                        zIndex: 1,
                    },
                ], children: _jsx(View, { style: [
                        a.relative,
                        {
                            width: '120%',
                        },
                    ], children: _jsx(View, { style: [
                            {
                                paddingTop: '100%',
                            },
                        ], children: _jsx(View, { style: [
                                a.absolute,
                                a.inset_0,
                                a.rounded_full,
                                a.align_center,
                                a.justify_center,
                                {
                                    backgroundColor: t.atoms.text_contrast_low.color,
                                },
                            ], children: computedTotal > 0 ? (_jsx(Text, { style: [
                                    gtPhone ? a.text_md : a.text_xs,
                                    a.font_semi_bold,
                                    a.leading_snug,
                                    { color: 'white' },
                                ], children: _jsxs(Trans, { comment: "Indicates the number of additional profiles are in the Starter Pack e.g. +12", children: ["+", computedTotal] }) })) : (_jsx(Plus, { fill: "white" })) }) }) }) })] }));
}
export function StarterPackCardSkeleton() {
    var t = useTheme();
    var gtPhone = useBreakpoints().gtPhone;
    var profileCount = gtPhone ? 11 : 8;
    return (_jsxs(View, { style: [
            a.w_full,
            a.p_lg,
            a.gap_md,
            a.border,
            a.rounded_sm,
            a.overflow_hidden,
            t.atoms.border_contrast_low,
        ], children: [_jsx(AvatarStack, { profiles: [], numPending: profileCount }), _jsxs(View, { style: [
                    a.w_full,
                    a.flex_row,
                    a.align_start,
                    a.gap_lg,
                    web({
                        position: 'static',
                        zIndex: 'unset',
                    }),
                ], children: [_jsxs(View, { style: [a.flex_1, a.gap_xs], children: [_jsx(LoadingPlaceholder, { width: 180, height: 18 }), _jsx(LoadingPlaceholder, { width: 120, height: 14 })] }), _jsx(LoadingPlaceholder, { width: 100, height: 33 })] })] }));
}
var templateObject_1, templateObject_2;
