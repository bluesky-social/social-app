var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Nux, useNux, useSaveNux } from '#/state/queries/nuxs';
import { atoms as a, select, useTheme } from '#/alf';
import { useAgeAssuranceCopy } from '#/components/ageAssurance/useAgeAssuranceCopy';
import { Button } from '#/components/Button';
import { ShieldCheck_Stroke2_Corner0_Rounded as Shield } from '#/components/icons/Shield';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
import { useAgeAssurance } from '#/ageAssurance';
import { useAnalytics } from '#/analytics';
export function useInternalState() {
    var aa = useAgeAssurance();
    var nux = useNux(Nux.AgeAssuranceDismissibleFeedBanner).nux;
    var _a = useSaveNux(), save = _a.mutate, variables = _a.variables;
    var hidden = !!variables;
    var visible = useMemo(function () {
        if (aa.state.access === aa.Access.Full)
            return false;
        if (aa.state.lastInitiatedAt)
            return false;
        if (aa.state.error === 'config')
            return false;
        if (hidden)
            return false;
        if (nux && nux.completed)
            return false;
        return true;
    }, [aa, hidden, nux]);
    var close = function () {
        save({
            id: Nux.AgeAssuranceDismissibleFeedBanner,
            completed: true,
            data: undefined,
        });
    };
    return { visible: visible, close: close };
}
export function AgeAssuranceDismissibleFeedBanner() {
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var _a = useInternalState(), visible = _a.visible, close = _a.close;
    var copy = useAgeAssuranceCopy();
    if (!visible)
        return null;
    return (_jsxs(View, { style: [
            a.px_lg,
            {
                paddingVertical: 10,
                backgroundColor: select(t.name, {
                    light: t.palette.primary_25,
                    dark: t.palette.primary_25,
                    dim: t.palette.primary_25,
                }),
            },
        ], children: [_jsxs(Link, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Learn more about age assurance"], ["Learn more about age assurance"])))), to: "/settings/account", onPress: function () {
                    close();
                    ax.metric('ageAssurance:navigateToSettings', {});
                }, style: [a.w_full, a.justify_between, a.align_center, a.gap_md], children: [_jsx(View, { style: [
                            a.align_center,
                            a.justify_center,
                            a.rounded_full,
                            {
                                width: 42,
                                height: 42,
                                backgroundColor: select(t.name, {
                                    light: t.palette.primary_100,
                                    dark: t.palette.primary_100,
                                    dim: t.palette.primary_100,
                                }),
                            },
                        ], children: _jsx(Shield, { size: "lg" }) }), _jsx(View, { style: [
                            a.flex_1,
                            {
                                paddingRight: 40,
                            },
                        ], children: _jsx(View, { style: { maxWidth: 400 }, children: _jsx(Text, { style: [a.leading_snug], children: copy.banner }) }) })] }), _jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Don't show again"], ["Don't show again"])))), size: "small", onPress: function () {
                    close();
                    ax.metric('ageAssurance:dismissFeedBanner', {});
                }, style: [
                    a.absolute,
                    a.justify_center,
                    a.align_center,
                    {
                        top: 0,
                        bottom: 0,
                        right: 0,
                        paddingRight: a.px_md.paddingLeft,
                    },
                ], children: _jsx(X, { width: 20, fill: select(t.name, {
                        light: t.palette.primary_600,
                        dark: t.palette.primary_600,
                        dim: t.palette.primary_600,
                    }) }) })] }));
}
var templateObject_1, templateObject_2;
