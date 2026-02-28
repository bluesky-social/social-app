var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { embedPlayerSources, externalEmbedLabels, } from '#/lib/strings/embed-player';
import { useSetExternalEmbedPref } from '#/state/preferences';
import { atoms as a, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Text } from '#/components/Typography';
export function EmbedConsentDialog(_a) {
    var control = _a.control, source = _a.source, onAccept = _a.onAccept;
    var _ = useLingui()._;
    var setExternalEmbedPref = useSetExternalEmbedPref();
    var onShowAllPress = useCallback(function () {
        for (var _i = 0, embedPlayerSources_1 = embedPlayerSources; _i < embedPlayerSources_1.length; _i++) {
            var key = embedPlayerSources_1[_i];
            setExternalEmbedPref(key, 'show');
        }
        onAccept();
        control.close();
    }, [control, onAccept, setExternalEmbedPref]);
    var onShowPress = useCallback(function () {
        setExternalEmbedPref(source, 'show');
        onAccept();
        control.close();
    }, [control, onAccept, setExternalEmbedPref, source]);
    var onHidePress = useCallback(function () {
        setExternalEmbedPref(source, 'hide');
        control.close();
    }, [control, setExternalEmbedPref, source]);
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["External Media"], ["External Media"])))), style: web({ maxWidth: 400 }), children: [_jsxs(View, { style: a.gap_sm, children: [_jsx(Text, { style: [a.text_2xl, a.font_bold], children: _jsx(Trans, { children: "External Media" }) }), _jsxs(View, { style: [a.mt_sm, a.mb_2xl, a.gap_lg], children: [_jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsxs(Trans, { children: ["This content is hosted by ", externalEmbedLabels[source], ". Do you want to enable external media?"] }) }), _jsx(Admonition, { type: "info", children: _jsx(Trans, { children: "External media may allow websites to collect information about you and your device. No information is sent or requested until you press the \"play\" button." }) })] })] }), _jsxs(View, { style: a.gap_md, children: [_jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Enable external media"], ["Enable external media"])))), onPress: onShowAllPress, onAccessibilityEscape: control.close, color: "primary", size: "large", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Enable external media" }) }) }), _jsx(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Enable this source only"], ["Enable this source only"])))), onPress: onShowPress, onAccessibilityEscape: control.close, color: "secondary", size: "large", children: _jsx(ButtonText, { children: _jsxs(Trans, { children: ["Enable ", externalEmbedLabels[source], " only"] }) }) }), _jsx(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["No thanks"], ["No thanks"])))), onAccessibilityEscape: control.close, onPress: onHidePress, color: "secondary", size: "large", variant: "ghost", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "No thanks" }) }) })] }), _jsx(Dialog.Close, {})] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
