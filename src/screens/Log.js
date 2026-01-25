var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { LayoutAnimation, View } from 'react-native';
import { Pressable } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useFocusEffect } from '@react-navigation/native';
import { useGetTimeAgo } from '#/lib/hooks/useTimeAgo';
import { getEntries } from '#/logger/logDump';
import { useTickEveryMinute } from '#/state/shell';
import { useSetMinimalShellMode } from '#/state/shell';
import { atoms as a, useTheme } from '#/alf';
import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon, ChevronTop_Stroke2_Corner0_Rounded as ChevronTopIcon, } from '#/components/icons/Chevron';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';
export function LogScreen(_a) {
    var t = useTheme();
    var _ = useLingui()._;
    var setMinimalShellMode = useSetMinimalShellMode();
    var _b = useState([]), expanded = _b[0], setExpanded = _b[1];
    var timeAgo = useGetTimeAgo();
    var tick = useTickEveryMinute();
    useFocusEffect(useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    var toggler = function (id) { return function () {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (expanded.includes(id)) {
            setExpanded(expanded.filter(function (v) { return v !== id; }));
        }
        else {
            setExpanded(__spreadArray(__spreadArray([], expanded, true), [id], false));
        }
    }; };
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "System log" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: getEntries()
                    .slice(0)
                    .map(function (entry) {
                    return (_jsxs(View, { children: [_jsxs(Pressable, { style: [
                                    a.flex_row,
                                    a.align_center,
                                    a.py_md,
                                    a.px_sm,
                                    a.border_b,
                                    t.atoms.border_contrast_low,
                                    t.atoms.bg,
                                    a.gap_sm,
                                ], onPress: toggler(entry.id), accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["View debug entry"], ["View debug entry"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Opens additional details for a debug entry"], ["Opens additional details for a debug entry"])))), children: [entry.level === 'warn' || entry.level === 'error' ? (_jsx(WarningIcon, { size: "sm", fill: t.palette.negative_500 })) : (_jsx(CircleInfoIcon, { size: "sm" })), _jsxs(View, { style: [
                                            a.flex_1,
                                            a.flex_row,
                                            a.justify_start,
                                            a.align_center,
                                            a.gap_sm,
                                        ], children: [entry.context && (_jsxs(Text, { style: [t.atoms.text_contrast_medium], children: ["(", String(entry.context), ")"] })), _jsx(Text, { children: String(entry.message) })] }), entry.metadata &&
                                        Object.keys(entry.metadata).length > 0 &&
                                        (expanded.includes(entry.id) ? (_jsx(ChevronTopIcon, { size: "sm", style: [t.atoms.text_contrast_low] })) : (_jsx(ChevronBottomIcon, { size: "sm", style: [t.atoms.text_contrast_low] }))), _jsx(Text, { style: [{ minWidth: 40 }, t.atoms.text_contrast_medium], children: timeAgo(entry.timestamp, tick) })] }), expanded.includes(entry.id) && (_jsx(View, { style: [
                                    t.atoms.bg_contrast_25,
                                    a.rounded_xs,
                                    a.p_sm,
                                    a.border_b,
                                    t.atoms.border_contrast_low,
                                ], children: _jsx(View, { style: [a.px_sm, a.py_xs], children: _jsx(Text, { style: [a.leading_snug, { fontFamily: 'monospace' }], children: JSON.stringify(entry.metadata, null, 2) }) }) }))] }, "entry-".concat(entry.id)));
                }) })] }));
}
var templateObject_1, templateObject_2;
