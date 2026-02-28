import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { atoms as a, useTheme } from '#/alf';
import * as ProfileCard from '#/components/ProfileCard';
export function ProfileCardWithFollowBtn(_a) {
    var profile = _a.profile, noBorder = _a.noBorder, _b = _a.logContext, logContext = _b === void 0 ? 'ProfileCard' : _b, position = _a.position, contextProfileDid = _a.contextProfileDid;
    var t = useTheme();
    var moderationOpts = useModerationOpts();
    if (!moderationOpts)
        return null;
    return (_jsx(View, { style: [
            a.py_md,
            a.px_xl,
            !noBorder && [a.border_t, t.atoms.border_contrast_low],
        ], children: _jsx(ProfileCard.Default, { profile: profile, moderationOpts: moderationOpts, logContext: logContext, position: position, contextProfileDid: contextProfileDid }) }));
}
