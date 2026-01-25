var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { measure, runOnJS, runOnUI, useAnimatedRef, } from 'react-native-reanimated';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { usePalette } from '#/lib/hooks/usePalette';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeHandle } from '#/lib/strings/handles';
import { emitSoftReset } from '#/state/events';
import { useLightboxControls } from '#/state/lightbox';
import { TextLink } from '#/view/com/util/Link';
import { LoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { Text } from '#/view/com/util/text/Text';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { StarterPack } from '#/components/icons/StarterPack';
import * as Layout from '#/components/Layout';
export function ProfileSubpageHeader(_a) {
    var isLoading = _a.isLoading, href = _a.href, title = _a.title, avatar = _a.avatar, isOwner = _a.isOwner, purpose = _a.purpose, creator = _a.creator, avatarType = _a.avatarType, children = _a.children;
    var navigation = useNavigation();
    var _ = useLingui()._;
    var isMobile = useWebMediaQueries().isMobile;
    var openLightbox = useLightboxControls().openLightbox;
    var pal = usePalette('default');
    var canGoBack = navigation.canGoBack();
    var aviRef = useAnimatedRef();
    var _openLightbox = React.useCallback(function (uri, thumbRect) {
        openLightbox({
            images: [
                {
                    uri: uri,
                    thumbUri: uri,
                    thumbRect: thumbRect,
                    dimensions: {
                        // It's fine if it's actually smaller but we know it's 1:1.
                        height: 1000,
                        width: 1000,
                    },
                    thumbDimensions: null,
                    type: 'rect-avi',
                },
            ],
            index: 0,
        });
    }, [openLightbox]);
    var onPressAvi = React.useCallback(function () {
        if (avatar // TODO && !(view.moderation.avatar.blur && view.moderation.avatar.noOverride)
        ) {
            runOnUI(function () {
                'worklet';
                var rect = measure(aviRef);
                runOnJS(_openLightbox)(avatar, rect);
            })();
        }
    }, [_openLightbox, avatar, aviRef]);
    return (_jsxs(_Fragment, { children: [_jsxs(Layout.Header.Outer, { children: [canGoBack ? (_jsx(Layout.Header.BackButton, {})) : (_jsx(Layout.Header.MenuButton, {})), _jsx(Layout.Header.Content, {}), children] }), _jsxs(View, { style: {
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                    paddingTop: 14,
                    paddingBottom: 14,
                    paddingHorizontal: isMobile ? 12 : 14,
                }, children: [_jsx(Animated.View, { ref: aviRef, collapsable: false, children: _jsx(Pressable, { testID: "headerAviButton", onPress: onPressAvi, accessibilityRole: "image", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["View the avatar"], ["View the avatar"])))), accessibilityHint: "", style: { width: 58 }, children: avatarType === 'starter-pack' ? (_jsx(StarterPack, { width: 58, gradient: "sky" })) : (_jsx(UserAvatar, { type: avatarType, size: 58, avatar: avatar })) }) }), _jsxs(View, { style: { flex: 1, gap: 4 }, children: [isLoading ? (_jsx(LoadingPlaceholder, { width: 200, height: 32, style: { marginVertical: 6 } })) : (_jsx(TextLink, { testID: "headerTitle", type: "title-xl", href: href, style: [pal.text, { fontWeight: '600' }], text: title || '', onPress: emitSoftReset, numberOfLines: 4 })), isLoading || !creator ? (_jsx(LoadingPlaceholder, { width: 50, height: 8 })) : (_jsx(Text, { type: "lg", style: [pal.textLight], numberOfLines: 1, children: purpose === 'app.bsky.graph.defs#curatelist' ? (isOwner ? (_jsx(Trans, { children: "List by you" })) : (_jsxs(Trans, { children: ["List by", ' ', _jsx(TextLink, { text: sanitizeHandle(creator.handle || '', '@'), href: makeProfileLink(creator), style: pal.textLight })] }))) : purpose === 'app.bsky.graph.defs#modlist' ? (isOwner ? (_jsx(Trans, { children: "Moderation list by you" })) : (_jsxs(Trans, { children: ["Moderation list by", ' ', _jsx(TextLink, { text: sanitizeHandle(creator.handle || '', '@'), href: makeProfileLink(creator), style: pal.textLight })] }))) : purpose === 'app.bsky.graph.defs#referencelist' ? (isOwner ? (_jsx(Trans, { children: "Starter pack by you" })) : (_jsxs(Trans, { children: ["Starter pack by", ' ', _jsx(TextLink, { text: sanitizeHandle(creator.handle || '', '@'), href: makeProfileLink(creator), style: pal.textLight })] }))) : null }))] })] })] }));
}
var templateObject_1;
