import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { moderateFeedGenerator } from '@atproto/api';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { atoms as a, useTheme } from '#/alf';
import * as FeedCard from '#/components/FeedCard';
import { ContentHider } from '#/components/moderation/ContentHider';
export function FeedEmbed(_a) {
    var embed = _a.embed;
    var t = useTheme();
    return (_jsx(FeedCard.Link, { view: embed.view, style: [a.border, t.atoms.border_contrast_low, a.p_sm, a.rounded_md], children: _jsx(FeedCard.Outer, { children: _jsxs(FeedCard.Header, { children: [_jsx(FeedCard.Avatar, { src: embed.view.avatar, size: 48 }), _jsx(FeedCard.TitleAndByline, { title: embed.view.displayName, creator: embed.view.creator, uri: embed.view.uri })] }) }) }));
}
export function ModeratedFeedEmbed(_a) {
    var embed = _a.embed;
    var moderationOpts = useModerationOpts();
    var moderation = useMemo(function () {
        return moderationOpts
            ? moderateFeedGenerator(embed.view, moderationOpts)
            : undefined;
    }, [embed.view, moderationOpts]);
    return (_jsx(ContentHider, { modui: moderation === null || moderation === void 0 ? void 0 : moderation.ui('contentList'), childContainerStyle: [a.pt_xs], children: _jsx(FeedEmbed, { embed: embed }) }));
}
