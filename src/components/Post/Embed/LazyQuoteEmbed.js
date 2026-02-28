import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { View } from 'react-native';
import { createEmbedViewRecordFromPost } from '#/state/queries/postgate/util';
import { useResolveLinkQuery } from '#/state/queries/resolve-link';
import { atoms as a, useTheme } from '#/alf';
import { QuoteEmbed } from '#/components/Post/Embed';
export function LazyQuoteEmbed(_a) {
    var uri = _a.uri, linkDisabled = _a.linkDisabled;
    var t = useTheme();
    var data = useResolveLinkQuery(uri).data;
    var view = useMemo(function () {
        if (!data || data.type !== 'record' || data.kind !== 'post')
            return;
        return createEmbedViewRecordFromPost(data.view);
    }, [data]);
    return view ? (_jsx(QuoteEmbed, { embed: {
            type: 'post',
            view: view,
        }, linkDisabled: linkDisabled })) : (_jsx(View, { style: [
            a.w_full,
            a.rounded_md,
            t.atoms.bg_contrast_25,
            {
                height: 68,
            },
        ] }));
}
