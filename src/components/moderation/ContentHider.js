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
import React from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { ADULT_CONTENT_LABELS, isJustAMute } from '#/lib/moderation';
import { useGlobalLabelStrings } from '#/lib/moderation/useGlobalLabelStrings';
import { getDefinition, getLabelStrings } from '#/lib/moderation/useLabelInfo';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { useLabelDefinitions } from '#/state/preferences';
import { atoms as a, useBreakpoints, useTheme, web } from '#/alf';
import { Button } from '#/components/Button';
import { ModerationDetailsDialog, useModerationDetailsDialogControl, } from '#/components/moderation/ModerationDetailsDialog';
import { Text } from '#/components/Typography';
export function ContentHider(_a) {
    var testID = _a.testID, modui = _a.modui, ignoreMute = _a.ignoreMute, style = _a.style, activeStyle = _a.activeStyle, childContainerStyle = _a.childContainerStyle, children = _a.children;
    var blur = modui === null || modui === void 0 ? void 0 : modui.blurs[0];
    if (!blur || (ignoreMute && isJustAMute(modui))) {
        return (_jsx(View, { testID: testID, style: style, children: typeof children === 'function' ? children({ active: false }) : children }));
    }
    return (_jsx(ContentHiderActive, { testID: testID, modui: modui, style: [style, activeStyle], childContainerStyle: childContainerStyle, children: typeof children === 'function' ? children({ active: true }) : children }));
}
function ContentHiderActive(_a) {
    var testID = _a.testID, modui = _a.modui, style = _a.style, childContainerStyle = _a.childContainerStyle, children = _a.children;
    var t = useTheme();
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var _b = React.useState(false), override = _b[0], setOverride = _b[1];
    var control = useModerationDetailsDialogControl();
    var labelDefs = useLabelDefinitions().labelDefs;
    var globalLabelStrings = useGlobalLabelStrings();
    var i18n = useLingui().i18n;
    var blur = modui === null || modui === void 0 ? void 0 : modui.blurs[0];
    var desc = useModerationCauseDescription(blur);
    var labelName = React.useMemo(function () {
        if (!(modui === null || modui === void 0 ? void 0 : modui.blurs) || !blur) {
            return undefined;
        }
        if (blur.type !== 'label' ||
            (blur.type === 'label' && blur.source.type !== 'user')) {
            if (desc.isSubjectAccount) {
                return _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " (Account)"], ["", " (Account)"])), desc.name));
            }
            else {
                return desc.name;
            }
        }
        var hasAdultContentLabel = false;
        var selfBlurNames = modui.blurs
            .filter(function (cause) {
            if (cause.type !== 'label') {
                return false;
            }
            if (cause.source.type !== 'user') {
                return false;
            }
            if (ADULT_CONTENT_LABELS.includes(cause.label.val)) {
                if (hasAdultContentLabel) {
                    return false;
                }
                hasAdultContentLabel = true;
            }
            return true;
        })
            .slice(0, 2)
            .map(function (cause) {
            if (cause.type !== 'label') {
                return;
            }
            var def = cause.labelDef || getDefinition(labelDefs, cause.label);
            if (def.identifier === 'porn' || def.identifier === 'sexual') {
                return _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Adult Content"], ["Adult Content"]))));
            }
            return getLabelStrings(i18n.locale, globalLabelStrings, def).name;
        });
        if (selfBlurNames.length === 0) {
            return desc.name;
        }
        return __spreadArray([], new Set(selfBlurNames), true).join(', ');
    }, [
        _,
        modui === null || modui === void 0 ? void 0 : modui.blurs,
        blur,
        desc.name,
        desc.isSubjectAccount,
        labelDefs,
        i18n.locale,
        globalLabelStrings,
    ]);
    return (_jsxs(View, { testID: testID, style: [a.overflow_hidden, style], children: [_jsx(ModerationDetailsDialog, { control: control, modcause: blur }), _jsx(Button, { onPress: function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!modui.noOverride) {
                        setOverride(function (v) { return !v; });
                    }
                    else {
                        control.open();
                    }
                }, label: desc.name, accessibilityHint: modui.noOverride
                    ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Learn more about the moderation applied to this content"], ["Learn more about the moderation applied to this content"]))))
                    : override
                        ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Hides the content"], ["Hides the content"]))))
                        : _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Shows the content"], ["Shows the content"])))), children: function (state) { return (_jsxs(View, { style: [
                        a.flex_row,
                        a.w_full,
                        a.justify_start,
                        a.align_center,
                        a.py_md,
                        a.px_lg,
                        a.gap_xs,
                        a.rounded_sm,
                        t.atoms.bg_contrast_25,
                        gtMobile && [a.gap_sm, a.py_lg, a.mt_xs, a.px_xl],
                        (state.hovered || state.pressed) && t.atoms.bg_contrast_50,
                    ], children: [_jsx(desc.icon, { size: "md", fill: t.atoms.text_contrast_medium.color, style: { marginLeft: -2 } }), _jsx(Text, { style: [
                                a.flex_1,
                                a.text_left,
                                a.font_semi_bold,
                                a.leading_snug,
                                gtMobile && [a.font_semi_bold],
                                t.atoms.text_contrast_medium,
                                web({
                                    marginBottom: 1,
                                }),
                            ], numberOfLines: 2, children: labelName }), !modui.noOverride && (_jsx(Text, { style: [
                                a.font_semi_bold,
                                a.leading_snug,
                                gtMobile && [a.font_semi_bold],
                                t.atoms.text_contrast_high,
                                web({
                                    marginBottom: 1,
                                }),
                            ], children: override ? _jsx(Trans, { children: "Hide" }) : _jsx(Trans, { children: "Show" }) }))] })); } }), desc.source && blur.type === 'label' && !override && (_jsx(Button, { onPress: function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    control.open();
                }, label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Learn more about the moderation applied to this content"], ["Learn more about the moderation applied to this content"])))), style: [a.pt_sm], children: function (state) { return (_jsxs(Text, { style: [
                        a.flex_1,
                        a.text_sm,
                        a.font_normal,
                        a.leading_snug,
                        t.atoms.text_contrast_medium,
                        a.text_left,
                    ], children: [desc.sourceType === 'user' ? (_jsx(Trans, { children: "Labeled by the author." })) : (_jsxs(Trans, { children: ["Labeled by ", sanitizeDisplayName(desc.source), "."] })), ' ', _jsx(Text, { style: [
                                { color: t.palette.primary_500 },
                                a.text_sm,
                                state.hovered && [web({ textDecoration: 'underline' })],
                            ], children: _jsx(Trans, { children: "Learn more." }) })] })); } })), override && _jsx(View, { style: childContainerStyle, children: children })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
