var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { AvatarCreatorCircle } from '#/screens/Onboarding/StepProfile/AvatarCreatorCircle';
import { useAvatar } from '#/screens/Onboarding/StepProfile/index';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { Pencil_Stroke2_Corner0_Rounded as Pencil } from '#/components/icons/Pencil';
import { StreamingLive_Stroke2_Corner0_Rounded as StreamingLive } from '#/components/icons/StreamingLive';
export function AvatarCircle(_a) {
    var openLibrary = _a.openLibrary, openCreator = _a.openCreator;
    var _ = useLingui()._;
    var t = useTheme();
    var avatar = useAvatar().avatar;
    var styles = React.useMemo(function () { return ({
        imageContainer: [
            a.rounded_full,
            a.overflow_hidden,
            a.align_center,
            a.justify_center,
            a.border,
            t.atoms.border_contrast_low,
            t.atoms.bg_contrast_25,
            {
                height: 200,
                width: 200,
            },
        ],
    }); }, [t.atoms.bg_contrast_25, t.atoms.border_contrast_low]);
    return (_jsxs(View, { children: [avatar.useCreatedAvatar ? (_jsx(AvatarCreatorCircle, { avatar: avatar, size: 200 })) : avatar.image ? (_jsx(ExpoImage, { source: avatar.image.path, style: styles.imageContainer, accessibilityIgnoresInvertColors: true, transition: { duration: 300, effect: 'cross-dissolve' } })) : (_jsx(View, { style: styles.imageContainer, children: _jsx(StreamingLive, { height: 100, width: 100, style: { color: t.palette.contrast_200 } }) })), _jsx(View, { style: [a.absolute, { bottom: 2, right: 2 }], children: _jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Select an avatar"], ["Select an avatar"])))), size: "large", shape: "round", variant: "solid", color: "primary", onPress: avatar.useCreatedAvatar ? openCreator : openLibrary, children: _jsx(ButtonIcon, { icon: Pencil }) }) })] }));
}
var templateObject_1;
