import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Trans } from '@lingui/react/macro';
import { PressableScale } from '#/lib/custom-animations/PressableScale';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, platform, useTheme } from '#/alf';
import { Text } from '#/components/Typography';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
export function Autocomplete(_a) {
    var prefix = _a.prefix, onSelect = _a.onSelect;
    var t = useTheme();
    var isActive = !!prefix;
    var _b = useActorAutocompleteQuery(prefix, true), suggestions = _b.data, isFetching = _b.isFetching;
    if (!isActive)
        return null;
    return (_jsx(Animated.View, { entering: FadeInDown.duration(200), exiting: FadeOut.duration(100), style: [
            t.atoms.bg,
            a.mt_sm,
            a.border,
            a.rounded_sm,
            t.atoms.border_contrast_high,
            { marginLeft: -62 },
        ], children: (suggestions === null || suggestions === void 0 ? void 0 : suggestions.length) ? (suggestions.slice(0, 5).map(function (item, index, arr) {
            return (_jsx(AutocompleteProfileCard, { profile: item, itemIndex: index, totalItems: arr.length, onPress: function () {
                    onSelect(item.handle);
                } }, item.did));
        })) : (_jsx(Text, { style: [a.text_md, a.px_sm, a.py_md], children: isFetching ? _jsx(Trans, { children: "Loading..." }) : _jsx(Trans, { children: "No result" }) })) }));
}
function AutocompleteProfileCard(_a) {
    var _b, _c;
    var profile = _a.profile, itemIndex = _a.itemIndex, totalItems = _a.totalItems, onPress = _a.onPress;
    var t = useTheme();
    var state = useSimpleVerificationState({ profile: profile });
    var displayName = sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle));
    return (_jsx(View, { style: [
            itemIndex !== totalItems - 1 && a.border_b,
            t.atoms.border_contrast_high,
            a.px_sm,
            a.py_md,
        ], children: _jsxs(PressableScale, { testID: "autocompleteButton", style: [a.flex_row, a.gap_lg, a.justify_between, a.align_center], onPress: onPress, accessibilityLabel: "Select ".concat(profile.handle), accessibilityHint: "", children: [_jsxs(View, { style: [a.flex_row, a.gap_sm, a.align_center, a.flex_1], children: [_jsx(UserAvatar, { avatar: (_b = profile.avatar) !== null && _b !== void 0 ? _b : null, size: 24, type: ((_c = profile.associated) === null || _c === void 0 ? void 0 : _c.labeler) ? 'labeler' : 'user' }), _jsxs(View, { style: [
                                a.flex_row,
                                a.align_center,
                                a.gap_xs,
                                platform({ ios: a.flex_1 }),
                            ], children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], emoji: true, numberOfLines: 1, children: displayName }), state.isVerified && (_jsx(View, { style: [
                                        {
                                            marginTop: platform({ android: -2 }),
                                        },
                                    ], children: _jsx(VerificationCheck, { width: 12, verifier: state.role === 'verifier' }) }))] })] }), _jsx(Text, { style: [t.atoms.text_contrast_medium, a.text_right, a.leading_snug], numberOfLines: 1, children: sanitizeHandle(profile.handle, '@') })] }) }, profile.did));
}
