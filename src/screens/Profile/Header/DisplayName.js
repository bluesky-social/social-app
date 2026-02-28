import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Text } from '#/components/Typography';
export function ProfileHeaderDisplayName(_a) {
    var profile = _a.profile, moderation = _a.moderation;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    return (_jsx(View, { pointerEvents: "none", children: _jsx(Text, { emoji: true, testID: "profileHeaderDisplayName", style: [
                t.atoms.text,
                gtMobile ? a.text_4xl : a.text_3xl,
                a.self_start,
                a.font_bold,
            ], children: sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle), moderation.ui('displayName')) }) }));
}
