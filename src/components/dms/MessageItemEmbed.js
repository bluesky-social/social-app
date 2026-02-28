import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { atoms as a, native, tokens, useTheme, web } from '#/alf';
import { PostEmbedViewContext } from '#/components/Post/Embed';
import { Embed } from '#/components/Post/Embed';
import { MessageContextProvider } from './MessageContext';
var MessageItemEmbed = function (_a) {
    var embed = _a.embed;
    var t = useTheme();
    var screen = useWindowDimensions();
    return (_jsx(MessageContextProvider, { children: _jsx(View, { style: [
                a.my_xs,
                t.atoms.bg,
                a.rounded_md,
                native({
                    flexBasis: 0,
                    width: Math.min(screen.width, 600) / 1.4,
                }),
                web({
                    width: '100%',
                    minWidth: 280,
                    maxWidth: 360,
                }),
            ], children: _jsx(View, { style: { marginTop: tokens.space.sm * -1 }, children: _jsx(Embed, { embed: embed, allowNestedQuotes: true, viewContext: PostEmbedViewContext.Feed }) }) }) }));
};
MessageItemEmbed = React.memo(MessageItemEmbed);
export { MessageItemEmbed };
