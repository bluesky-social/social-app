var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { AppBskyGraphStarterpack, AtUri } from '@atproto/api';
import { msg, Plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { sanitizeHandle } from '#/lib/strings/handles';
import { getStarterPackOgCard } from '#/lib/strings/starter-pack';
import { precacheResolvedUri } from '#/state/queries/resolve-uri';
import { precacheStarterPack } from '#/state/queries/starter-packs';
import { useSession } from '#/state/session';
import { atoms as a, useTheme } from '#/alf';
import { StarterPack as StarterPackIcon } from '#/components/icons/StarterPack';
import { Link as BaseLink, } from '#/components/Link';
import { Text } from '#/components/Typography';
import * as bsky from '#/types/bsky';
export function Default(_a) {
    var starterPack = _a.starterPack;
    if (!starterPack)
        return null;
    return (_jsx(Link, { starterPack: starterPack, children: _jsx(Card, { starterPack: starterPack }) }));
}
export function Notification(_a) {
    var starterPack = _a.starterPack;
    if (!starterPack)
        return null;
    return (_jsx(Link, { starterPack: starterPack, children: _jsx(Card, { starterPack: starterPack, noIcon: true, noDescription: true }) }));
}
export function Card(_a) {
    var starterPack = _a.starterPack, noIcon = _a.noIcon, noDescription = _a.noDescription;
    var record = starterPack.record, creator = starterPack.creator, joinedAllTimeCount = starterPack.joinedAllTimeCount;
    var _ = useLingui()._;
    var t = useTheme();
    var currentAccount = useSession().currentAccount;
    if (!bsky.dangerousIsType(record, AppBskyGraphStarterpack.isRecord)) {
        return null;
    }
    return (_jsxs(View, { style: [a.w_full, a.gap_md], children: [_jsxs(View, { style: [a.flex_row, a.gap_sm, a.w_full], children: [!noIcon ? _jsx(StarterPackIcon, { width: 40, gradient: "sky" }) : null, _jsxs(View, { style: [a.flex_1], children: [_jsx(Text, { emoji: true, style: [a.text_md, a.font_semi_bold, a.leading_snug], numberOfLines: 2, children: record.name }), _jsx(Text, { emoji: true, style: [a.leading_snug, t.atoms.text_contrast_medium], numberOfLines: 1, children: (creator === null || creator === void 0 ? void 0 : creator.did) === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)
                                    ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Starter pack by you"], ["Starter pack by you"]))))
                                    : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Starter pack by ", ""], ["Starter pack by ", ""])), sanitizeHandle(creator.handle, '@'))) })] })] }), !noDescription && record.description ? (_jsx(Text, { emoji: true, numberOfLines: 3, style: [a.leading_snug], children: record.description })) : null, !!joinedAllTimeCount && joinedAllTimeCount >= 50 && (_jsx(Text, { style: [a.font_semi_bold, t.atoms.text_contrast_medium], children: _jsxs(Trans, { comment: "Number of users (always at least 50) who have joined Bluesky using a specific starter pack", children: [_jsx(Plural, { value: joinedAllTimeCount, other: "# users have" }), " joined!"] }) }))] }));
}
export function useStarterPackLink(_a) {
    var view = _a.view;
    var _ = useLingui()._;
    var qc = useQueryClient();
    var _b = React.useMemo(function () {
        var rkey = new AtUri(view.uri).rkey;
        var creator = view.creator;
        return { rkey: rkey, handleOrDid: creator.handle || creator.did };
    }, [view]), rkey = _b.rkey, handleOrDid = _b.handleOrDid;
    var precache = function () {
        precacheResolvedUri(qc, view.creator.handle, view.creator.did);
        precacheStarterPack(qc, view);
    };
    return {
        to: "/starter-pack/".concat(handleOrDid, "/").concat(rkey),
        label: AppBskyGraphStarterpack.isRecord(view.record)
            ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Navigate to ", ""], ["Navigate to ", ""])), view.record.name))
            : _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Navigate to starter pack"], ["Navigate to starter pack"])))),
        precache: precache,
    };
}
export function Link(_a) {
    var starterPack = _a.starterPack, children = _a.children;
    var _ = useLingui()._;
    var queryClient = useQueryClient();
    var record = starterPack.record;
    var _b = React.useMemo(function () {
        var rkey = new AtUri(starterPack.uri).rkey;
        var creator = starterPack.creator;
        return { rkey: rkey, handleOrDid: creator.handle || creator.did };
    }, [starterPack]), rkey = _b.rkey, handleOrDid = _b.handleOrDid;
    if (!AppBskyGraphStarterpack.isRecord(record)) {
        return null;
    }
    return (_jsx(BaseLink, { to: "/starter-pack/".concat(handleOrDid, "/").concat(rkey), label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Navigate to ", ""], ["Navigate to ", ""])), record.name)), onPress: function () {
            precacheResolvedUri(queryClient, starterPack.creator.handle, starterPack.creator.did);
            precacheStarterPack(queryClient, starterPack);
        }, style: [a.flex_col, a.align_start], children: children }));
}
export function Embed(_a) {
    var starterPack = _a.starterPack;
    var t = useTheme();
    var imageUri = getStarterPackOgCard(starterPack);
    return (_jsx(View, { style: [
            a.border,
            a.rounded_sm,
            a.overflow_hidden,
            t.atoms.border_contrast_low,
        ], children: _jsxs(Link, { starterPack: starterPack, children: [_jsx(Image, { source: imageUri, style: [a.w_full, a.aspect_card], accessibilityIgnoresInvertColors: true }), _jsx(View, { style: [a.px_sm, a.py_md], children: _jsx(Card, { starterPack: starterPack }) })] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
