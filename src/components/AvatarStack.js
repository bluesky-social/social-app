import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { moderateProfile } from '@atproto/api';
import { logger } from '#/logger';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useProfilesQuery } from '#/state/queries/profile';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useTheme } from '#/alf';
export function AvatarStack(_a) {
    var profiles = _a.profiles, _b = _a.size, size = _b === void 0 ? 26 : _b, numPending = _a.numPending, backgroundColor = _a.backgroundColor;
    var translation = size / 3; // overlap by 1/3
    var t = useTheme();
    var moderationOpts = useModerationOpts();
    var isPending = (numPending && profiles.length === 0) || !moderationOpts;
    var items = isPending
        ? Array.from({ length: numPending !== null && numPending !== void 0 ? numPending : profiles.length }).map(function (_, i) { return ({
            key: i,
            profile: null,
            moderation: null,
        }); })
        : profiles.map(function (item) { return ({
            key: item.did,
            profile: item,
            moderation: moderateProfile(item, moderationOpts),
        }); });
    return (_jsx(View, { style: [
            a.flex_row,
            a.align_center,
            a.relative,
            { width: size + (items.length - 1) * (size - translation) },
        ], children: items.map(function (item, i) {
            var _a;
            return (_jsx(View, { style: [
                    t.atoms.bg_contrast_25,
                    a.relative,
                    {
                        width: size,
                        height: size,
                        left: i * -translation,
                        borderWidth: 1,
                        borderColor: backgroundColor !== null && backgroundColor !== void 0 ? backgroundColor : t.atoms.bg.backgroundColor,
                        borderRadius: 999,
                        zIndex: 3 - i,
                    },
                ], children: item.profile && (_jsx(UserAvatar, { size: size - 2, avatar: item.profile.avatar, type: ((_a = item.profile.associated) === null || _a === void 0 ? void 0 : _a.labeler) ? 'labeler' : 'user', moderation: item.moderation.ui('avatar') })) }, item.key));
        }) }));
}
export function AvatarStackWithFetch(_a) {
    var profiles = _a.profiles, size = _a.size, backgroundColor = _a.backgroundColor;
    var _b = useProfilesQuery({ handles: profiles }), data = _b.data, error = _b.error;
    if (error) {
        if (error.name !== 'AbortError') {
            logger.error('Error fetching profiles for AvatarStack', {
                safeMessage: error,
            });
        }
        return null;
    }
    return (_jsx(AvatarStack, { numPending: profiles.length, profiles: (data === null || data === void 0 ? void 0 : data.profiles) || [], size: size, backgroundColor: backgroundColor }));
}
