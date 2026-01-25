var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { parseAltFromGIFDescription } from '#/lib/gif-alt-text';
import { useHaptics } from '#/lib/haptics';
import { shareUrl } from '#/lib/sharing';
import { parseEmbedPlayerFromUrl } from '#/lib/strings/embed-player';
import { toNiceDomain } from '#/lib/strings/url-helpers';
import { useExternalEmbedsPrefs } from '#/state/preferences';
import { atoms as a, useTheme } from '#/alf';
import { Divider } from '#/components/Divider';
import { Earth_Stroke2_Corner0_Rounded as Globe } from '#/components/icons/Globe';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
import { ExternalGif } from './ExternalGif';
import { ExternalPlayer } from './ExternalPlayer';
import { GifEmbed } from './Gif';
export var ExternalEmbed = function (_a) {
    var link = _a.link, onOpen = _a.onOpen, style = _a.style, hideAlt = _a.hideAlt;
    var _ = useLingui()._;
    var t = useTheme();
    var playHaptic = useHaptics();
    var externalEmbedPrefs = useExternalEmbedsPrefs();
    var niceUrl = toNiceDomain(link.uri);
    var imageUri = link.thumb;
    var embedPlayerParams = React.useMemo(function () {
        var params = parseEmbedPlayerFromUrl(link.uri);
        if (params && (externalEmbedPrefs === null || externalEmbedPrefs === void 0 ? void 0 : externalEmbedPrefs[params.source]) !== 'hide') {
            return params;
        }
    }, [link.uri, externalEmbedPrefs]);
    var hasMedia = Boolean(imageUri || embedPlayerParams);
    var onPress = useCallback(function () {
        playHaptic('Light');
        onOpen === null || onOpen === void 0 ? void 0 : onOpen();
    }, [playHaptic, onOpen]);
    var onShareExternal = useCallback(function () {
        if (link.uri && IS_NATIVE) {
            playHaptic('Heavy');
            shareUrl(link.uri);
        }
    }, [link.uri, playHaptic]);
    if ((embedPlayerParams === null || embedPlayerParams === void 0 ? void 0 : embedPlayerParams.source) === 'tenor') {
        var parsedAlt = parseAltFromGIFDescription(link.description);
        return (_jsx(View, { style: style, children: _jsx(GifEmbed, { params: embedPlayerParams, thumb: link.thumb, altText: parsedAlt.alt, isPreferredAltText: parsedAlt.isPreferred, hideAlt: hideAlt }) }));
    }
    return (_jsx(Link, { label: link.title || _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Open link to ", ""], ["Open link to ", ""])), niceUrl)), to: link.uri, shouldProxy: true, onPress: onPress, onLongPress: onShareExternal, children: function (_a) {
            var hovered = _a.hovered;
            return (_jsxs(View, { style: [
                    a.transition_color,
                    a.flex_col,
                    a.rounded_md,
                    a.overflow_hidden,
                    a.w_full,
                    a.border,
                    style,
                    hovered
                        ? t.atoms.border_contrast_high
                        : t.atoms.border_contrast_low,
                ], children: [imageUri && !embedPlayerParams ? (_jsx(Image, { style: [a.aspect_card], source: { uri: imageUri }, accessibilityIgnoresInvertColors: true, loading: "lazy" })) : undefined, (embedPlayerParams === null || embedPlayerParams === void 0 ? void 0 : embedPlayerParams.isGif) ? (_jsx(ExternalGif, { link: link, params: embedPlayerParams })) : embedPlayerParams ? (_jsx(ExternalPlayer, { link: link, params: embedPlayerParams })) : undefined, _jsxs(View, { style: [
                            a.flex_1,
                            a.pt_sm,
                            { gap: 3 },
                            hasMedia && a.border_t,
                            hovered
                                ? t.atoms.border_contrast_high
                                : t.atoms.border_contrast_low,
                        ], children: [_jsxs(View, { style: [{ gap: 3 }, a.pb_xs, a.px_md], children: [!(embedPlayerParams === null || embedPlayerParams === void 0 ? void 0 : embedPlayerParams.isGif) && !(embedPlayerParams === null || embedPlayerParams === void 0 ? void 0 : embedPlayerParams.dimensions) && (_jsx(Text, { emoji: true, numberOfLines: 3, style: [a.text_md, a.font_semi_bold, a.leading_snug], children: link.title || link.uri })), link.description ? (_jsx(Text, { emoji: true, numberOfLines: link.thumb ? 2 : 4, style: [a.text_sm, a.leading_snug], children: link.description })) : undefined] }), _jsxs(View, { style: [a.px_md], children: [_jsx(Divider, {}), _jsxs(View, { style: [
                                            a.flex_row,
                                            a.align_center,
                                            a.gap_2xs,
                                            a.pb_sm,
                                            {
                                                paddingTop: 6, // off menu
                                            },
                                        ], children: [_jsx(Globe, { size: "xs", style: [
                                                    a.transition_color,
                                                    hovered
                                                        ? t.atoms.text_contrast_medium
                                                        : t.atoms.text_contrast_low,
                                                ] }), _jsx(Text, { numberOfLines: 1, style: [
                                                    a.transition_color,
                                                    a.text_xs,
                                                    a.leading_snug,
                                                    hovered
                                                        ? t.atoms.text_contrast_high
                                                        : t.atoms.text_contrast_medium,
                                                ], children: toNiceDomain(link.uri) })] })] })] })] }));
        } }));
};
var templateObject_1;
