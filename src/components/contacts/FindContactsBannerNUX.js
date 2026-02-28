var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { HITSLOP_10 } from '#/lib/constants';
import { Nux, useNux, useSaveNux } from '#/state/queries/nuxs';
import { atoms as a, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
import { Link } from '../Link';
import { useIsFindContactsFeatureEnabledBasedOnGeolocation } from './country-allowlist';
export function FindContactsBannerNUX() {
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var _a = useInternalState(), visible = _a.visible, close = _a.close;
    if (!visible)
        return null;
    return (_jsx(View, { style: [a.w_full, a.p_lg, a.border_b, t.atoms.border_contrast_low], children: _jsxs(View, { style: a.w_full, children: [_jsx(Link, { to: { screen: 'FindContactsFlow' }, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Import contacts to find your friends"], ["Import contacts to find your friends"])))), onPress: function () {
                        ax.metric('contacts:nux:bannerPressed', {});
                    }, style: [
                        a.w_full,
                        a.rounded_xl,
                        a.curve_continuous,
                        a.overflow_hidden,
                    ], children: _jsxs(LinearGradient, { colors: [t.palette.primary_200, t.palette.primary_50], start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 }, style: [
                            a.w_full,
                            a.h_full,
                            a.flex_row,
                            a.align_center,
                            a.gap_lg,
                            a.pl_lg,
                        ], children: [_jsx(Image, { source: require('../../../assets/images/find_friends_illustration_small.webp'), accessibilityIgnoresInvertColors: true, style: [
                                    { height: 70, aspectRatio: 573 / 286 },
                                    a.self_end,
                                    a.mt_sm,
                                ] }), _jsx(View, { style: [a.flex_1, a.justify_center, a.py_xl, a.pr_5xl], children: _jsx(Text, { style: [
                                        a.text_md,
                                        a.font_bold,
                                        { color: t.palette.primary_900 },
                                    ], children: _jsx(Trans, { children: "Import contacts to find your friends" }) }) })] }) }), _jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Dismiss banner"], ["Dismiss banner"])))), hitSlop: HITSLOP_10, onPress: close, style: [a.absolute, { top: 14, right: 14 }], hoverStyle: [a.bg_transparent, { opacity: 0.5 }], children: _jsx(XIcon, { size: "xs", style: [t.atoms.text_contrast_low] }) })] }) }));
}
function useInternalState() {
    var ax = useAnalytics();
    var nux = useNux(Nux.FindContactsDismissibleBanner).nux;
    var _a = useSaveNux(), save = _a.mutate, variables = _a.variables;
    var hidden = !!variables;
    var isFeatureEnabled = useIsFindContactsFeatureEnabledBasedOnGeolocation();
    var visible = useMemo(function () {
        if (IS_WEB)
            return false;
        if (hidden)
            return false;
        if (nux && nux.completed)
            return false;
        if (!isFeatureEnabled)
            return false;
        return true;
    }, [hidden, nux, isFeatureEnabled]);
    var close = function () {
        save({
            id: Nux.FindContactsDismissibleBanner,
            completed: true,
            data: undefined,
        });
        ax.metric('contacts:nux:bannerDismissed', {});
    };
    return { visible: visible, close: close };
}
var templateObject_1, templateObject_2;
