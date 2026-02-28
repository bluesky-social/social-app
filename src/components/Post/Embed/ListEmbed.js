import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { moderateUserList } from '@atproto/api';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { atoms as a, useTheme } from '#/alf';
import * as ListCard from '#/components/ListCard';
import { ContentHider } from '#/components/moderation/ContentHider';
export function ListEmbed(_a) {
    var embed = _a.embed;
    var t = useTheme();
    return (_jsx(ListCard.Default, { view: embed.view, style: [a.border, t.atoms.border_contrast_low, a.p_md, a.rounded_sm] }));
}
export function ModeratedListEmbed(_a) {
    var embed = _a.embed;
    var moderationOpts = useModerationOpts();
    var moderation = useMemo(function () {
        return moderationOpts
            ? moderateUserList(embed.view, moderationOpts)
            : undefined;
    }, [embed.view, moderationOpts]);
    return (_jsx(ContentHider, { modui: moderation === null || moderation === void 0 ? void 0 : moderation.ui('contentList'), childContainerStyle: [a.pt_xs], children: _jsx(ListEmbed, { embed: embed }) }));
}
