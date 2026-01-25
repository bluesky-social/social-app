var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Pressable, StyleSheet, View, } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';
import { addStyle } from '#/lib/styles';
import { precacheProfile } from '#/state/queries/profile';
// import {Link} from '#/components/Link' TODO this imposes some styles that screw things up
import { Link } from '#/view/com/util/Link';
import { atoms as a, useTheme } from '#/alf';
import { ModerationDetailsDialog, useModerationDetailsDialogControl, } from '#/components/moderation/ModerationDetailsDialog';
import { Text } from '#/components/Typography';
export function PostHider(_a) {
    var testID = _a.testID, href = _a.href, disabled = _a.disabled, modui = _a.modui, style = _a.style, hiderStyle = _a.hiderStyle, children = _a.children, iconSize = _a.iconSize, iconStyles = _a.iconStyles, profile = _a.profile, interpretFilterAsBlur = _a.interpretFilterAsBlur, props = __rest(_a, ["testID", "href", "disabled", "modui", "style", "hiderStyle", "children", "iconSize", "iconStyles", "profile", "interpretFilterAsBlur"]);
    var queryClient = useQueryClient();
    var t = useTheme();
    var _ = useLingui()._;
    var _b = React.useState(false), override = _b[0], setOverride = _b[1];
    var control = useModerationDetailsDialogControl();
    var blur = modui.blurs[0] ||
        (interpretFilterAsBlur ? getBlurrableFilter(modui) : undefined);
    var desc = useModerationCauseDescription(blur);
    var onBeforePress = React.useCallback(function () {
        precacheProfile(queryClient, profile);
    }, [queryClient, profile]);
    if (!blur || (disabled && !modui.noOverride)) {
        return (_jsx(Link, __assign({ testID: testID, style: style, href: href, accessible: false, onBeforePress: onBeforePress }, props, { children: children })));
    }
    return !override ? (_jsxs(Pressable, { onPress: function () {
            if (!modui.noOverride) {
                setOverride(function (v) { return !v; });
            }
        }, accessibilityRole: "button", accessibilityHint: override ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Hides the content"], ["Hides the content"])))) : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Shows the content"], ["Shows the content"])))), accessibilityLabel: "", style: [
            a.flex_row,
            a.align_center,
            a.gap_sm,
            a.py_md,
            {
                paddingLeft: 6,
                paddingRight: 18,
            },
            override ? { paddingBottom: 0 } : undefined,
            t.atoms.bg,
            hiderStyle,
        ], children: [_jsx(ModerationDetailsDialog, { control: control, modcause: blur }), _jsx(Pressable, { onPress: function () {
                    control.open();
                }, accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Learn more about this warning"], ["Learn more about this warning"])))), accessibilityHint: "", children: _jsx(View, { style: [
                        t.atoms.bg_contrast_25,
                        a.align_center,
                        a.justify_center,
                        {
                            width: iconSize,
                            height: iconSize,
                            borderRadius: iconSize,
                        },
                        iconStyles,
                    ], children: _jsx(desc.icon, { size: "sm", fill: t.atoms.text_contrast_medium.color }) }) }), _jsx(Text, { style: [t.atoms.text_contrast_medium, a.flex_1, a.leading_snug], numberOfLines: 1, children: desc.name }), !modui.noOverride && (_jsx(Text, { style: [{ color: t.palette.primary_500 }], children: override ? _jsx(Trans, { children: "Hide" }) : _jsx(Trans, { children: "Show" }) }))] })) : (_jsx(Link, __assign({ testID: testID, style: addStyle(style, styles.child), href: href, accessible: false }, props, { children: children })));
}
function getBlurrableFilter(modui) {
    // moderation causes get "downgraded" when they originate from embedded content
    // a downgraded cause should *only* drive filtering in feeds, so we want to look
    // for filters that arent downgraded
    return modui.filters.find(function (filter) { return !filter.downgraded; });
}
var styles = StyleSheet.create({
    child: {
        borderWidth: 0,
        borderTopWidth: 0,
        borderRadius: 8,
    },
});
var templateObject_1, templateObject_2, templateObject_3;
