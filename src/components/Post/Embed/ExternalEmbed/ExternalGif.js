var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { ActivityIndicator, Pressable, } from 'react-native';
import { Image } from 'expo-image';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useExternalEmbedsPrefs } from '#/state/preferences';
import { atoms as a, useTheme } from '#/alf';
import { useDialogControl } from '#/components/Dialog';
import { EmbedConsentDialog } from '#/components/dialogs/EmbedConsent';
import { Fill } from '#/components/Fill';
import { PlayButtonIcon } from '#/components/video/PlayButtonIcon';
import { IS_IOS, IS_NATIVE, IS_WEB } from '#/env';
export function ExternalGif(_a) {
    var link = _a.link, params = _a.params;
    var t = useTheme();
    var externalEmbedsPrefs = useExternalEmbedsPrefs();
    var _ = useLingui()._;
    var consentDialogControl = useDialogControl();
    // Tracking if the placer has been activated
    var _b = React.useState(false), isPlayerActive = _b[0], setIsPlayerActive = _b[1];
    // Tracking whether the gif has been loaded yet
    var _c = React.useState(false), isPrefetched = _c[0], setIsPrefetched = _c[1];
    // Tracking whether the image is animating
    var _d = React.useState(true), isAnimating = _d[0], setIsAnimating = _d[1];
    // Used for controlling animation
    var imageRef = React.useRef(null);
    var load = React.useCallback(function () {
        setIsPlayerActive(true);
        Image.prefetch(params.playerUri).then(function () {
            // Replace the image once it's fetched
            setIsPrefetched(true);
        });
    }, [params.playerUri]);
    var onPlayPress = React.useCallback(function (event) {
        // Don't propagate on web
        event.preventDefault();
        // Show consent if this is the first load
        if ((externalEmbedsPrefs === null || externalEmbedsPrefs === void 0 ? void 0 : externalEmbedsPrefs[params.source]) === undefined) {
            consentDialogControl.open();
            return;
        }
        // If the player isn't active, we want to activate it and prefetch the gif
        if (!isPlayerActive) {
            load();
            return;
        }
        // Control animation on native
        setIsAnimating(function (prev) {
            var _a, _b;
            if (prev) {
                if (IS_NATIVE) {
                    (_a = imageRef.current) === null || _a === void 0 ? void 0 : _a.stopAnimating();
                }
                return false;
            }
            else {
                if (IS_NATIVE) {
                    (_b = imageRef.current) === null || _b === void 0 ? void 0 : _b.startAnimating();
                }
                return true;
            }
        });
    }, [
        consentDialogControl,
        externalEmbedsPrefs,
        isPlayerActive,
        load,
        params.source,
    ]);
    return (_jsxs(_Fragment, { children: [_jsx(EmbedConsentDialog, { control: consentDialogControl, source: params.source, onAccept: load }), _jsxs(Pressable, { style: [
                    { height: 300 },
                    a.w_full,
                    a.overflow_hidden,
                    {
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                    },
                ], onPress: onPlayPress, accessibilityRole: "button", accessibilityHint: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Plays the GIF"], ["Plays the GIF"])))), accessibilityLabel: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Play ", ""], ["Play ", ""])), link.title)), children: [_jsx(Image, { source: {
                            uri: !isPrefetched || (IS_WEB && !isAnimating)
                                ? link.thumb
                                : params.playerUri,
                        }, style: { flex: 1 }, ref: imageRef, autoplay: isAnimating, contentFit: "contain", accessibilityIgnoresInvertColors: true, accessibilityLabel: link.title, accessibilityHint: link.title, cachePolicy: IS_IOS ? 'disk' : 'memory-disk' }), (!isPrefetched || !isAnimating) && (_jsxs(Fill, { style: [a.align_center, a.justify_center], children: [_jsx(Fill, { style: [
                                    t.name === 'light' ? t.atoms.bg_contrast_975 : t.atoms.bg,
                                    {
                                        opacity: 0.3,
                                    },
                                ] }), !isAnimating || !isPlayerActive ? ( // Play button when not animating or not active
                            _jsx(PlayButtonIcon, {})) : (
                            // Activity indicator while gif loads
                            _jsx(ActivityIndicator, { size: "large", color: "white" }))] }))] })] }));
}
var templateObject_1, templateObject_2;
