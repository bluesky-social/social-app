import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { BSKY_LABELER_DID } from '@atproto/api';
import { Trans } from '@lingui/react/macro';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { ModerationDetailsDialog, useModerationDetailsDialogControl, } from '#/components/moderation/ModerationDetailsDialog';
import { Text } from '#/components/Typography';
export function Row(_a) {
    var children = _a.children, style = _a.style, _b = _a.size, size = _b === void 0 ? 'sm' : _b;
    var styles = React.useMemo(function () {
        switch (size) {
            case 'lg':
                return [{ gap: 5 }];
            case 'sm':
            default:
                return [{ gap: 3 }];
        }
    }, [size]);
    return (_jsx(View, { style: [a.flex_row, a.flex_wrap, a.gap_xs, styles, style], children: children }));
}
export function Label(_a) {
    var cause = _a.cause, _b = _a.size, size = _b === void 0 ? 'sm' : _b, disableDetailsDialog = _a.disableDetailsDialog, noBg = _a.noBg;
    var t = useTheme();
    var control = useModerationDetailsDialogControl();
    var desc = useModerationCauseDescription(cause);
    var isLabeler = Boolean(desc.sourceType && desc.sourceDid);
    var isBlueskyLabel = desc.sourceType === 'labeler' && desc.sourceDid === BSKY_LABELER_DID;
    var _c = React.useMemo(function () {
        switch (size) {
            case 'lg': {
                return {
                    outer: [
                        t.atoms.bg_contrast_25,
                        {
                            gap: 5,
                            paddingHorizontal: 5,
                            paddingVertical: 5,
                        },
                    ],
                    avi: 16,
                    text: [a.text_sm],
                };
            }
            case 'sm':
            default: {
                return {
                    outer: [
                        !noBg && t.atoms.bg_contrast_25,
                        {
                            gap: 3,
                            paddingHorizontal: 3,
                            paddingVertical: 3,
                        },
                    ],
                    avi: 12,
                    text: [a.text_xs],
                };
            }
        }
    }, [t, size, noBg]), outer = _c.outer, avi = _c.avi, text = _c.text;
    return (_jsxs(_Fragment, { children: [_jsx(Button, { disabled: disableDetailsDialog, label: desc.name, onPress: function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    control.open();
                }, children: function (_a) {
                    var hovered = _a.hovered, pressed = _a.pressed;
                    return (_jsxs(View, { style: [
                            a.flex_row,
                            a.align_center,
                            a.rounded_full,
                            outer,
                            (hovered || pressed) && t.atoms.bg_contrast_50,
                        ], children: [isBlueskyLabel || !isLabeler ? (_jsx(desc.icon, { width: avi, fill: t.atoms.text_contrast_medium.color })) : (_jsx(UserAvatar, { avatar: desc.sourceAvi, type: "user", size: avi })), _jsx(Text, { emoji: true, style: [
                                    text,
                                    a.font_semi_bold,
                                    a.leading_tight,
                                    t.atoms.text_contrast_medium,
                                    { paddingRight: 3 },
                                ], children: desc.name })] }));
                } }), !disableDetailsDialog && (_jsx(ModerationDetailsDialog, { control: control, modcause: cause }))] }));
}
export function FollowsYou(_a) {
    var _b = _a.size, size = _b === void 0 ? 'sm' : _b;
    var t = useTheme();
    var variantStyles = React.useMemo(function () {
        switch (size) {
            case 'sm':
            case 'lg':
            default:
                return [
                    {
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 4,
                    },
                ];
        }
    }, [size]);
    return (_jsx(View, { style: [variantStyles, a.justify_center, t.atoms.bg_contrast_50], children: _jsx(Text, { style: [a.text_xs, a.leading_tight], children: _jsx(Trans, { children: "Follows You" }) }) }));
}
