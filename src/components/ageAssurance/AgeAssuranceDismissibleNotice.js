var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { Nux, useNux, useSaveNux } from '#/state/queries/nuxs';
import { atoms as a } from '#/alf';
import { AgeAssuranceAdmonition } from '#/components/ageAssurance/AgeAssuranceAdmonition';
import { AgeAssuranceConfigUnavailableError } from '#/components/ageAssurance/AgeAssuranceErrors';
import { useAgeAssuranceCopy } from '#/components/ageAssurance/useAgeAssuranceCopy';
import { Button, ButtonIcon } from '#/components/Button';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { useAgeAssurance } from '#/ageAssurance';
import { useAnalytics } from '#/analytics';
export function AgeAssuranceDismissibleNotice(_a) {
    var style = _a.style;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var aa = useAgeAssurance();
    var nux = useNux(Nux.AgeAssuranceDismissibleNotice).nux;
    var copy = useAgeAssuranceCopy();
    var _b = useSaveNux(), save = _b.mutate, variables = _b.variables;
    var hidden = !!variables;
    if (aa.state.access === aa.Access.Full)
        return null;
    if (aa.state.lastInitiatedAt)
        return null;
    if (hidden)
        return null;
    if (nux && nux.completed)
        return null;
    return (_jsx(View, { style: style, children: aa.state.error === 'config' ? (_jsx(AgeAssuranceConfigUnavailableError, {})) : (_jsxs(View, { children: [_jsx(AgeAssuranceAdmonition, { children: copy.notice }), _jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Don't show again"], ["Don't show again"])))), size: "tiny", variant: "solid", color: "secondary_inverted", shape: "round", onPress: function () {
                        save({
                            id: Nux.AgeAssuranceDismissibleNotice,
                            completed: true,
                            data: undefined,
                        });
                        ax.metric('ageAssurance:dismissSettingsNotice', {});
                    }, style: [
                        a.absolute,
                        {
                            top: 12,
                            right: 12,
                        },
                    ], children: _jsx(ButtonIcon, { icon: X }) })] })) }));
}
var templateObject_1;
