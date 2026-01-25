import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { Trans } from '@lingui/macro';
import { usePalette } from '#/lib/hooks/usePalette';
import { InfoCircleIcon } from '#/lib/icons';
import { TextLink } from '../util/Link';
import { Text } from '../util/text/Text';
export function DiscoverFallbackHeader() {
    var pal = usePalette('default');
    return (_jsxs(View, { style: [
            {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderTopWidth: 1,
            },
            pal.border,
            pal.viewLight,
        ], children: [_jsx(View, { style: { width: 68, paddingLeft: 12 }, children: _jsx(InfoCircleIcon, { size: 36, style: pal.textLight, strokeWidth: 1.5 }) }), _jsx(View, { style: { flex: 1 }, children: _jsx(Text, { type: "md", style: pal.text, children: _jsxs(Trans, { children: ["We ran out of posts from your follows. Here's the latest from", ' ', _jsx(TextLink, { type: "md-medium", href: "/profile/bsky.app/feed/whats-hot", text: "Discover", style: pal.link }), "."] }) }) })] }));
}
