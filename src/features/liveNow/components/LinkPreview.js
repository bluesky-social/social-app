import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Trans } from '@lingui/react/macro';
import { toNiceDomain } from '#/lib/strings/url-helpers';
import { LoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { atoms as a, useTheme } from '#/alf';
import { Globe_Stroke2_Corner0_Rounded as GlobeIcon } from '#/components/icons/Globe';
import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import { Text } from '#/components/Typography';
export function LinkPreview(_a) {
    var linkMeta = _a.linkMeta, loading = _a.loading;
    var t = useTheme();
    var _b = useState(false), imageLoadError = _b[0], setImageLoadError = _b[1];
    if (!linkMeta && !loading) {
        return null;
    }
    return (_jsxs(View, { style: [
            a.w_full,
            a.border,
            t.atoms.border_contrast_low,
            t.atoms.bg,
            a.flex_row,
            a.rounded_sm,
            a.overflow_hidden,
            a.align_stretch,
        ], children: [_jsxs(View, { style: [
                    t.atoms.bg_contrast_25,
                    { minHeight: 64, width: 114 },
                    a.justify_center,
                    a.align_center,
                    a.gap_xs,
                ], children: [(linkMeta === null || linkMeta === void 0 ? void 0 : linkMeta.image) && (_jsx(Image, { source: linkMeta.image, accessibilityIgnoresInvertColors: true, transition: 200, style: [a.absolute, a.inset_0], contentFit: "cover", onLoad: function () { return setImageLoadError(false); }, onError: function () { return setImageLoadError(true); } })), linkMeta && (!linkMeta.image || imageLoadError) && (_jsxs(_Fragment, { children: [_jsx(ImageIcon, { style: [t.atoms.text_contrast_low] }), _jsx(Text, { style: [t.atoms.text_contrast_low, a.text_xs, a.text_center], children: _jsx(Trans, { children: "No image" }) })] }))] }), _jsx(View, { style: [a.flex_1, a.justify_center, a.py_sm, a.gap_xs, a.px_md], children: linkMeta ? (_jsxs(_Fragment, { children: [_jsx(Text, { numberOfLines: 2, style: [a.leading_snug, a.font_semi_bold, a.text_md], children: linkMeta.title || linkMeta.url }), _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_2xs], children: [_jsx(GlobeIcon, { size: "xs", style: [t.atoms.text_contrast_low] }), _jsx(Text, { numberOfLines: 1, style: [
                                        a.text_xs,
                                        a.leading_snug,
                                        t.atoms.text_contrast_medium,
                                    ], children: toNiceDomain(linkMeta.url) })] })] })) : (_jsxs(_Fragment, { children: [_jsx(LoadingPlaceholder, { height: 16, width: 128 }), _jsx(LoadingPlaceholder, { height: 12, width: 72 })] })) })] }));
}
