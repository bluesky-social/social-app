var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useGlobalLabelStrings } from '#/lib/moderation/useGlobalLabelStrings';
import { useLabelBehaviorDescription } from '#/lib/moderation/useLabelBehaviorDescription';
import { getLabelStrings } from '#/lib/moderation/useLabelInfo';
import { usePreferencesQuery, usePreferencesSetContentLabelMutation, } from '#/state/queries/preferences';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import * as ToggleButton from '#/components/forms/ToggleButton';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '../icons/CircleInfo';
export function Outer(_a) {
    var children = _a.children;
    return (_jsx(View, { style: [
            a.flex_row,
            a.gap_sm,
            a.px_lg,
            a.py_lg,
            a.justify_between,
            a.flex_wrap,
        ], children: children }));
}
export function Content(_a) {
    var children = _a.children, name = _a.name, description = _a.description;
    var t = useTheme();
    var gtPhone = useBreakpoints().gtPhone;
    return (_jsxs(View, { style: [a.gap_xs, a.flex_1], children: [_jsx(Text, { emoji: true, style: [a.font_semi_bold, gtPhone ? a.text_sm : a.text_md], children: name }), _jsx(Text, { emoji: true, style: [t.atoms.text_contrast_medium, a.leading_snug], children: description }), children] }));
}
export function Buttons(_a) {
    var name = _a.name, values = _a.values, onChange = _a.onChange, ignoreLabel = _a.ignoreLabel, warnLabel = _a.warnLabel, hideLabel = _a.hideLabel, disabled = _a.disabled;
    var _ = useLingui()._;
    return (_jsx(View, { style: [{ minHeight: 35 }, a.w_full], children: _jsxs(ToggleButton.Group, { disabled: disabled, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Configure content filtering setting for category: ", ""], ["Configure content filtering setting for category: ", ""])), name)), values: values, onChange: onChange, children: [ignoreLabel && (_jsx(ToggleButton.Button, { name: "ignore", label: ignoreLabel, children: _jsx(ToggleButton.ButtonText, { children: ignoreLabel }) })), warnLabel && (_jsx(ToggleButton.Button, { name: "warn", label: warnLabel, children: _jsx(ToggleButton.ButtonText, { children: warnLabel }) })), hideLabel && (_jsx(ToggleButton.Button, { name: "hide", label: hideLabel, children: _jsx(ToggleButton.ButtonText, { children: hideLabel }) }))] }) }));
}
/**
 * For use on the global Moderation screen to set prefs for a "global" label,
 * not scoped to a single labeler.
 */
export function GlobalLabelPreference(_a) {
    var _b, _c;
    var labelDefinition = _a.labelDefinition, disabled = _a.disabled;
    var _ = useLingui()._;
    var identifier = labelDefinition.identifier;
    var preferences = usePreferencesQuery().data;
    var _d = usePreferencesSetContentLabelMutation(), mutate = _d.mutate, variables = _d.variables;
    var savedPref = preferences === null || preferences === void 0 ? void 0 : preferences.moderationPrefs.labels[identifier];
    var pref = (_c = (_b = variables === null || variables === void 0 ? void 0 : variables.visibility) !== null && _b !== void 0 ? _b : savedPref) !== null && _c !== void 0 ? _c : 'warn';
    var allLabelStrings = useGlobalLabelStrings();
    var labelStrings = labelDefinition.identifier in allLabelStrings
        ? allLabelStrings[labelDefinition.identifier]
        : {
            name: labelDefinition.identifier,
            description: "Labeled \"".concat(labelDefinition.identifier, "\""),
        };
    var labelOptions = {
        hide: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Hide"], ["Hide"])))),
        warn: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Warn"], ["Warn"])))),
        ignore: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Show"], ["Show"])))),
    };
    return (_jsxs(Outer, { children: [_jsx(Content, { name: labelStrings.name, description: labelStrings.description }), _jsx(Buttons, { name: labelStrings.name.toLowerCase(), values: [pref], onChange: function (values) {
                    mutate({
                        label: identifier,
                        visibility: values[0],
                        labelerDid: undefined,
                    });
                }, ignoreLabel: labelOptions.ignore, warnLabel: labelOptions.warn, hideLabel: labelOptions.hide, disabled: disabled })] }));
}
/**
 * For use on individual labeler pages
 */
export function LabelerLabelPreference(_a) {
    var _b, _c, _d, _e;
    var labelDefinition = _a.labelDefinition, disabled = _a.disabled, labelerDid = _a.labelerDid;
    var _f = useLingui(), _ = _f._, i18n = _f.i18n;
    var t = useTheme();
    var gtPhone = useBreakpoints().gtPhone;
    var isGlobalLabel = !labelDefinition.definedBy;
    var identifier = labelDefinition.identifier;
    var preferences = usePreferencesQuery().data;
    var _g = usePreferencesSetContentLabelMutation(), mutate = _g.mutate, variables = _g.variables;
    var savedPref = labelerDid && !isGlobalLabel
        ? (_b = preferences === null || preferences === void 0 ? void 0 : preferences.moderationPrefs.labelers.find(function (l) { return l.did === labelerDid; })) === null || _b === void 0 ? void 0 : _b.labels[identifier]
        : preferences === null || preferences === void 0 ? void 0 : preferences.moderationPrefs.labels[identifier];
    var pref = (_e = (_d = (_c = variables === null || variables === void 0 ? void 0 : variables.visibility) !== null && _c !== void 0 ? _c : savedPref) !== null && _d !== void 0 ? _d : labelDefinition.defaultSetting) !== null && _e !== void 0 ? _e : 'warn';
    // does the 'warn' setting make sense for this label?
    var canWarn = !(labelDefinition.blurs === 'none' && labelDefinition.severity === 'none');
    // is this label adult only?
    var adultOnly = labelDefinition.flags.includes('adult');
    // is this label disabled because it's adult only?
    var adultDisabled = adultOnly && !(preferences === null || preferences === void 0 ? void 0 : preferences.moderationPrefs.adultContentEnabled);
    // are there any reasons we cant configure this label here?
    var cantConfigure = isGlobalLabel || adultDisabled;
    var showConfig = !disabled && (gtPhone || !cantConfigure);
    // adjust the pref based on whether warn is available
    var prefAdjusted = pref;
    if (adultDisabled) {
        prefAdjusted = 'hide';
    }
    else if (!canWarn && pref === 'warn') {
        prefAdjusted = 'ignore';
    }
    // grab localized descriptions of the label and its settings
    var currentPrefLabel = useLabelBehaviorDescription(labelDefinition, prefAdjusted);
    var hideLabel = useLabelBehaviorDescription(labelDefinition, 'hide');
    var warnLabel = useLabelBehaviorDescription(labelDefinition, 'warn');
    var ignoreLabel = useLabelBehaviorDescription(labelDefinition, 'ignore');
    var globalLabelStrings = useGlobalLabelStrings();
    var labelStrings = getLabelStrings(i18n.locale, globalLabelStrings, labelDefinition);
    return (_jsxs(Outer, { children: [_jsx(Content, { name: labelStrings.name, description: labelStrings.description, children: cantConfigure && (_jsxs(View, { style: [a.flex_row, a.gap_xs, a.align_center, a.mt_xs], children: [_jsx(CircleInfo, { size: "sm", fill: t.atoms.text_contrast_high.color }), _jsx(Text, { style: [
                                t.atoms.text_contrast_medium,
                                a.font_semi_bold,
                                a.italic,
                            ], children: adultDisabled ? (_jsx(Trans, { children: "Adult content is disabled." })) : isGlobalLabel ? (_jsxs(Trans, { children: ["Configured in", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["moderation settings"], ["moderation settings"])))), to: "/moderation", style: a.text_sm, children: "moderation settings" }), "."] })) : null })] })) }), showConfig && (_jsx(_Fragment, { children: cantConfigure ? (_jsx(View, { style: [
                        { minHeight: 35 },
                        a.px_md,
                        a.py_md,
                        a.rounded_sm,
                        a.border,
                        t.atoms.border_contrast_low,
                        a.self_start,
                    ], children: _jsx(Text, { emoji: true, style: [a.font_semi_bold, t.atoms.text_contrast_low], children: currentPrefLabel }) })) : (_jsx(Buttons, { name: labelStrings.name.toLowerCase(), values: [pref], onChange: function (values) {
                        mutate({
                            label: identifier,
                            visibility: values[0],
                            labelerDid: labelerDid,
                        });
                    }, ignoreLabel: ignoreLabel, warnLabel: canWarn ? warnLabel : undefined, hideLabel: hideLabel })) }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
