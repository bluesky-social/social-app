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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Keyboard, View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { ADULT_CONTENT_LABELS, OTHER_SELF_LABELS, } from '#/lib/moderation';
import { atoms as a, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as Toggle from '#/components/forms/Toggle';
import { Check_Stroke2_Corner0_Rounded as Check } from '#/components/icons/Check';
import { TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronIcon } from '#/components/icons/Chevron';
import { Shield_Stroke2_Corner0_Rounded } from '#/components/icons/Shield';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
export function LabelsBtn(_a) {
    var labels = _a.labels, onChange = _a.onChange;
    var control = Dialog.useDialogControl();
    var _ = useLingui()._;
    var hasLabel = labels.length > 0;
    var updateAdultLabels = function (newLabels) {
        var newLabel = newLabels[newLabels.length - 1];
        var filtered = labels.filter(function (l) { return !ADULT_CONTENT_LABELS.includes(l); });
        onChange(__spreadArray([], new Set(__spreadArray(__spreadArray([], filtered, true), [newLabel], false).filter(Boolean)), true));
    };
    var updateOtherLabels = function (newLabels) {
        var newLabel = newLabels[newLabels.length - 1];
        var filtered = labels.filter(function (l) { return !OTHER_SELF_LABELS.includes(l); });
        onChange(__spreadArray([], new Set(__spreadArray(__spreadArray([], filtered, true), [newLabel], false).filter(Boolean)), true));
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Button, { color: "secondary", size: "small", testID: "labelsBtn", onPress: function () {
                    Keyboard.dismiss();
                    control.open();
                }, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Content warnings"], ["Content warnings"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Opens a dialog to add a content warning to your post"], ["Opens a dialog to add a content warning to your post"])))), children: [_jsx(ButtonIcon, { icon: hasLabel ? Check : Shield_Stroke2_Corner0_Rounded }), _jsx(ButtonText, { numberOfLines: 1, children: labels.length > 0 ? (_jsx(Trans, { children: "Labels added" })) : (_jsx(Trans, { children: "Labels" })) }), _jsx(ButtonIcon, { icon: TinyChevronIcon, size: "2xs" })] }), _jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, { labels: labels, updateAdultLabels: updateAdultLabels, updateOtherLabels: updateOtherLabels })] })] }));
}
function DialogInner(_a) {
    var labels = _a.labels, updateAdultLabels = _a.updateAdultLabels, updateOtherLabels = _a.updateOtherLabels;
    var _ = useLingui()._;
    var control = Dialog.useDialogContext();
    var t = useTheme();
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Add a content warning"], ["Add a content warning"])))), style: [{ maxWidth: 500 }, a.w_full], children: [_jsxs(View, { style: [a.flex_1], children: [_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.text_2xl, a.font_semi_bold], children: _jsx(Trans, { children: "Add a content warning" }) }), _jsx(Text, { style: [t.atoms.text_contrast_medium, a.leading_snug], children: _jsx(Trans, { children: "Please add any content warning labels that are applicable for the media you are posting." }) })] }), _jsxs(View, { style: [a.my_md, a.gap_lg], children: [_jsxs(View, { children: [_jsx(View, { style: [a.flex_row, a.align_center, a.justify_between, a.pb_sm], children: _jsx(Text, { style: [a.font_semi_bold, a.text_lg], children: _jsx(Trans, { children: "Adult Content" }) }) }), _jsxs(View, { style: [
                                            a.p_md,
                                            a.rounded_sm,
                                            a.border,
                                            t.atoms.border_contrast_medium,
                                        ], children: [_jsx(Toggle.Group, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Adult Content labels"], ["Adult Content labels"])))), values: labels, onChange: function (values) {
                                                    updateAdultLabels(values);
                                                }, children: _jsxs(View, { style: [a.gap_sm], children: [_jsxs(Toggle.Item, { name: "sexual", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Suggestive"], ["Suggestive"])))), children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { children: _jsx(Trans, { children: "Suggestive" }) })] }), _jsxs(Toggle.Item, { name: "nudity", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Nudity"], ["Nudity"])))), children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { children: _jsx(Trans, { children: "Nudity" }) })] }), _jsxs(Toggle.Item, { name: "porn", label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Porn"], ["Porn"])))), children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { children: _jsx(Trans, { children: "Adult" }) })] })] }) }), labels.includes('sexual') ||
                                                labels.includes('nudity') ||
                                                labels.includes('porn') ? (_jsx(Text, { style: [a.mt_sm, t.atoms.text_contrast_medium], children: labels.includes('sexual') ? (_jsx(Trans, { children: "Pictures meant for adults." })) : labels.includes('nudity') ? (_jsx(Trans, { children: "Artistic or non-erotic nudity." })) : labels.includes('porn') ? (_jsx(Trans, { children: "Sexual activity or erotic nudity." })) : ('') })) : null] })] }), _jsxs(View, { children: [_jsx(View, { style: [a.flex_row, a.align_center, a.justify_between, a.pb_sm], children: _jsx(Text, { style: [a.font_semi_bold, a.text_lg], children: _jsx(Trans, { children: "Other" }) }) }), _jsxs(View, { style: [
                                            a.p_md,
                                            a.rounded_sm,
                                            a.border,
                                            t.atoms.border_contrast_medium,
                                        ], children: [_jsx(Toggle.Group, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Adult Content labels"], ["Adult Content labels"])))), values: labels, onChange: function (values) {
                                                    updateOtherLabels(values);
                                                }, children: _jsxs(Toggle.Item, { name: "graphic-media", label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Graphic Media"], ["Graphic Media"])))), children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { children: _jsx(Trans, { children: "Graphic Media" }) })] }) }), labels.includes('graphic-media') ? (_jsx(Text, { style: [a.mt_sm, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Media that may be disturbing or inappropriate for some audiences." }) })) : null] })] })] })] }), _jsx(View, { style: [a.mt_sm, web([a.flex_row, a.ml_auto])], children: _jsx(Button, { label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Done"], ["Done"])))), onPress: function () { return control.close(); }, color: "primary", size: IS_WEB ? 'small' : 'large', variant: "solid", testID: "confirmBtn", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Done" }) }) }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;
