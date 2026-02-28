var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, useState } from 'react';
import { View } from 'react-native';
// @ts-expect-error missing types
import QRCode from 'react-native-qrcode-styled';
import { AppBskyGraphStarterpack } from '@atproto/api';
import { Trans } from '@lingui/react/macro';
import { Logo } from '#/view/icons/Logo';
import { Logotype } from '#/view/icons/Logotype';
import { atoms as a, useTheme } from '#/alf';
import { LinearGradientBackground } from '#/components/LinearGradientBackground';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
import * as bsky from '#/types/bsky';
var LazyViewShot = lazy(
// @ts-expect-error dynamic import
function () { return import('react-native-view-shot/src/index'); });
export function QrCode(_a) {
    var starterPack = _a.starterPack, link = _a.link, ref = _a.ref;
    var record = starterPack.record;
    if (!bsky.dangerousIsType(record, AppBskyGraphStarterpack.isRecord)) {
        return null;
    }
    return (_jsx(LazyViewShot, { ref: ref, children: _jsxs(LinearGradientBackground, { style: [
                { width: 300, minHeight: 390 },
                a.align_center,
                a.px_sm,
                a.py_xl,
                a.rounded_sm,
                a.justify_between,
                a.gap_md,
            ], children: [_jsx(View, { style: [a.gap_sm], children: _jsx(Text, { style: [
                            a.font_semi_bold,
                            a.text_3xl,
                            a.text_center,
                            { color: 'white' },
                        ], children: record.name }) }), _jsxs(View, { style: [a.gap_xl, a.align_center], children: [_jsx(Text, { style: [
                                a.font_semi_bold,
                                a.text_center,
                                { color: 'white', fontSize: 18 },
                            ], children: _jsx(Trans, { children: "Join the conversation" }) }), _jsx(View, { style: [a.rounded_sm, a.overflow_hidden], children: _jsx(QrCodeInner, { link: link }) }), _jsx(Text, { style: [
                                a.flex,
                                a.flex_row,
                                a.align_center,
                                a.font_semi_bold,
                                { color: 'white', fontSize: 18, gap: 6 },
                            ], children: _jsxs(Trans, { children: ["on", _jsxs(View, { style: [a.flex_row, a.align_center, { gap: 6 }], children: [_jsx(Logo, { width: 25, fill: "white" }), _jsx(View, { style: [{ marginTop: 3.5 }], children: _jsx(Logotype, { width: 72, fill: "white" }) })] })] }) })] })] }) }));
}
export function QrCodeInner(_a) {
    var link = _a.link;
    var t = useTheme();
    var _b = useState(null), logoArea = _b[0], setLogoArea = _b[1];
    var onLogoAreaChange = function (area) {
        setLogoArea(area);
    };
    return (_jsxs(View, { style: { position: 'relative' }, children: [IS_WEB && logoArea && (_jsx(View, { style: {
                    position: 'absolute',
                    left: logoArea.x,
                    top: logoArea.y + 1,
                    zIndex: 1,
                    padding: 4,
                }, children: _jsx(Logo, { width: logoArea.width - 14, height: logoArea.height - 14 }) })), _jsx(QRCode, { data: link, style: [
                    a.rounded_sm,
                    { height: 225, width: 225, backgroundColor: '#f3f3f3' },
                ], pieceSize: IS_WEB ? 8 : 6, padding: 20, pieceBorderRadius: IS_WEB ? 4.5 : 3.5, outerEyesOptions: {
                    topLeft: {
                        borderRadius: [12, 12, 0, 12],
                        color: t.palette.primary_500,
                    },
                    topRight: {
                        borderRadius: [12, 12, 12, 0],
                        color: t.palette.primary_500,
                    },
                    bottomLeft: {
                        borderRadius: [12, 0, 12, 12],
                        color: t.palette.primary_500,
                    },
                }, innerEyesOptions: { borderRadius: 3 }, logo: __assign(__assign(__assign({ href: require('../../../assets/logo.png') }, (IS_WEB && {
                    onChange: onLogoAreaChange,
                    padding: 28,
                })), (!IS_WEB && {
                    padding: 2,
                    scale: 0.95,
                })), { hidePieces: true }) })] }));
}
