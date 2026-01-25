var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { useWizardState } from '#/screens/StarterPack/Wizard/State';
import { atoms as a, useTheme } from '#/alf';
import * as TextField from '#/components/forms/TextField';
import { StarterPack } from '#/components/icons/StarterPack';
import { ScreenTransition } from '#/components/ScreenTransition';
import { Text } from '#/components/Typography';
export function StepDetails() {
    var _a, _b, _c;
    var _ = useLingui()._;
    var t = useTheme();
    var _d = useWizardState(), state = _d[0], dispatch = _d[1];
    var currentAccount = useSession().currentAccount;
    var currentProfile = useProfileQuery({
        did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did,
        staleTime: 300,
    }).data;
    return (_jsx(ScreenTransition, { direction: state.transitionDirection, enabledWeb: true, children: _jsxs(View, { style: [a.px_xl, a.gap_xl, a.mt_4xl], children: [_jsxs(View, { style: [a.gap_md, a.align_center, a.px_md, a.mb_md], children: [_jsx(StarterPack, { width: 90, gradient: "sky" }), _jsx(Text, { style: [a.font_semi_bold, a.text_3xl], children: _jsx(Trans, { children: "Invites, but personal" }) }), _jsx(Text, { style: [a.text_center, a.text_md, a.px_md], children: _jsx(Trans, { children: "Invite your friends to follow your favorite feeds and people" }) })] }), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "What do you want to call your starter pack?" }) }), _jsxs(TextField.Root, { children: [_jsx(TextField.Input, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", "'s starter pack"], ["", "'s starter pack"])), (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.displayName) || (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.handle))), value: state.name, onChangeText: function (text) { return dispatch({ type: 'SetName', name: text }); } }), _jsx(TextField.SuffixText, { label: _(msg({
                                        comment: 'Accessibility label describing how many characters the user has entered out of a 50-character limit in a text input field',
                                        message: "".concat((_a = state.name) === null || _a === void 0 ? void 0 : _a.length, " out of 50"),
                                    })), children: _jsxs(Text, { style: [t.atoms.text_contrast_medium], children: [(_c = (_b = state.name) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0, "/50"] }) })] })] }), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Tell us a little more" }) }), _jsx(TextField.Root, { children: _jsx(TextField.Input, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", "'s favorite feeds and people - join me!"], ["", "'s favorite feeds and people - join me!"])), (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.displayName) || (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.handle))), value: state.description, onChangeText: function (text) {
                                    return dispatch({ type: 'SetDescription', description: text });
                                }, multiline: true, style: { minHeight: 150 } }) })] })] }) }));
}
var templateObject_1, templateObject_2;
