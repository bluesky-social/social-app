var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useInterestsDisplayNames } from '#/lib/interests';
import { Nux, useSaveNux } from '#/state/queries/nuxs';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Shapes_Stroke2_Corner0_Rounded as Shapes } from '#/components/icons/Shapes';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Link } from '#/components/Link';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';
export function ExploreInterestsCard() {
    var _a;
    var t = useTheme();
    var _ = useLingui()._;
    var preferences = usePreferencesQuery().data;
    var interestsDisplayNames = useInterestsDisplayNames();
    var saveNux = useSaveNux().mutateAsync;
    var trendingPrompt = Prompt.usePromptControl();
    var _b = useState(false), closing = _b[0], setClosing = _b[1];
    var onClose = function () {
        trendingPrompt.open();
    };
    var onConfirmClose = function () {
        setClosing(true);
        // if this fails, they can try again later
        saveNux({
            id: Nux.ExploreInterestsCard,
            completed: true,
            data: undefined,
        }).catch(function () { });
    };
    return closing ? null : (_jsxs(_Fragment, { children: [_jsx(Prompt.Basic, { control: trendingPrompt, title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Dismiss interests"], ["Dismiss interests"])))), description: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["You can adjust your interests at any time from \"Content and media\" settings."], ["You can adjust your interests at any time from \"Content and media\" settings."])))), confirmButtonCta: _(msg({
                    message: "OK",
                    comment: "Confirm button text.",
                })), onConfirm: onConfirmClose }), _jsx(View, { style: [a.pb_2xs], children: _jsxs(View, { style: [
                        a.p_lg,
                        a.border_b,
                        a.gap_md,
                        t.atoms.border_contrast_medium,
                    ], children: [_jsxs(View, { style: [a.flex_row, a.gap_sm, a.align_center], children: [_jsx(Shapes, {}), _jsx(Text, { style: [a.text_xl, a.font_semi_bold, a.leading_tight], children: _jsx(Trans, { children: "Your interests" }) })] }), ((_a = preferences === null || preferences === void 0 ? void 0 : preferences.interests) === null || _a === void 0 ? void 0 : _a.tags) &&
                            preferences.interests.tags.length > 0 ? (_jsx(View, { style: [a.flex_row, a.flex_wrap, { gap: 6 }], children: preferences.interests.tags.map(function (tag) { return (_jsx(View, { style: [
                                    a.justify_center,
                                    a.align_center,
                                    a.rounded_full,
                                    t.atoms.bg_contrast_25,
                                    a.px_lg,
                                    { height: 32 },
                                ], children: _jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_high], children: interestsDisplayNames[tag] }) }, tag)); }) })) : null, _jsx(Text, { style: [a.text_sm, a.leading_snug], children: _jsx(Trans, { children: "Your interests help us find what you like!" }) }), _jsx(Link, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Edit interests"], ["Edit interests"])))), to: "/settings/interests", size: "small", variant: "solid", color: "primary", style: [a.justify_center], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Edit interests" }) }) }), _jsx(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Hide this card"], ["Hide this card"])))), size: "small", variant: "ghost", color: "secondary", shape: "round", onPress: onClose, style: [
                                a.absolute,
                                { top: a.pt_sm.paddingTop, right: a.pr_sm.paddingRight },
                            ], children: _jsx(ButtonIcon, { icon: X, size: "md" }) })] }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
