var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StyleSheet, View } from 'react-native';
import { AppBskyFeedDefs } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { isReasonFeedSource } from '#/lib/api/feed/types';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { makeProfileLink } from '#/lib/routes/links';
import { useSession } from '#/state/session';
import { atoms as a, useTheme } from '#/alf';
import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Repost_Stroke2_Corner3_Rounded as RepostIcon } from '#/components/icons/Repost';
import { Link } from '#/components/Link';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { Text } from '#/components/Typography';
import { FeedNameText } from '../util/FeedInfoText';
export function PostFeedReason(_a) {
    var reason = _a.reason, moderation = _a.moderation, onOpenReposter = _a.onOpenReposter;
    var t = useTheme();
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    if (isReasonFeedSource(reason)) {
        return (_jsx(Link, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Go to feed"], ["Go to feed"])))), to: reason.href, children: _jsx(Text, { style: [
                    t.atoms.text_contrast_medium,
                    a.font_medium,
                    a.leading_snug,
                    a.leading_snug,
                ], numberOfLines: 1, children: _jsxs(Trans, { context: "from-feed", children: ["From", ' ', _jsx(FeedNameText, { uri: reason.uri, href: reason.href, style: [
                                t.atoms.text_contrast_medium,
                                a.font_medium,
                                a.leading_snug,
                            ], numberOfLines: 1 })] }) }) }));
    }
    if (AppBskyFeedDefs.isReasonRepost(reason)) {
        var isOwner = reason.by.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
        var reposter = createSanitizedDisplayName(reason.by, false, moderation === null || moderation === void 0 ? void 0 : moderation.ui('displayName'));
        return (_jsxs(Link, { style: styles.includeReason, to: makeProfileLink(reason.by), label: isOwner ? _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Reposted by you"], ["Reposted by you"])))) : _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Reposted by ", ""], ["Reposted by ", ""])), reposter)), onPress: onOpenReposter, children: [_jsx(RepostIcon, { style: [t.atoms.text_contrast_medium, { marginRight: 3 }], width: 13, height: 13 }), _jsx(ProfileHoverCard, { did: reason.by.did, children: _jsx(Text, { style: [
                            t.atoms.text_contrast_medium,
                            a.font_medium,
                            a.leading_snug,
                        ], numberOfLines: 1, children: isOwner ? (_jsx(Trans, { children: "Reposted by you" })) : (_jsxs(Trans, { children: ["Reposted by ", reposter] })) }) })] }));
    }
    if (AppBskyFeedDefs.isReasonPin(reason)) {
        return (_jsxs(View, { style: styles.includeReason, children: [_jsx(PinIcon, { style: [t.atoms.text_contrast_medium, { marginRight: 3 }], width: 13, height: 13 }), _jsx(Text, { style: [t.atoms.text_contrast_medium, a.font_medium, a.leading_snug], numberOfLines: 1, children: _jsx(Trans, { children: "Pinned" }) })] }));
    }
}
var styles = StyleSheet.create({
    includeReason: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
        marginLeft: -16,
    },
});
var templateObject_1, templateObject_2, templateObject_3;
