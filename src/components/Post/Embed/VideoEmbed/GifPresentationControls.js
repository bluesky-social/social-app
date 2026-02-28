var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { HITSLOP_20 } from '#/lib/constants';
import { atoms as a, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { Fill } from '#/components/Fill';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';
import { PlayButtonIcon } from '#/components/video/PlayButtonIcon';
export function GifPresentationControls(_a) {
    var onPress = _a.onPress, isPlaying = _a.isPlaying, isLoading = _a.isLoading, altText = _a.altText;
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsxs(_Fragment, { children: [_jsx(Button, { label: isPlaying ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Pause GIF"], ["Pause GIF"])))) : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Play GIF"], ["Play GIF"])))), accessibilityHint: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Plays or pauses the GIF"], ["Plays or pauses the GIF"])))), style: [
                    a.absolute,
                    a.align_center,
                    a.justify_center,
                    a.inset_0,
                    { zIndex: 2 },
                ], onPress: onPress, children: isLoading ? (_jsx(View, { style: [a.align_center, a.justify_center], children: _jsx(ActivityIndicator, { size: "large", color: "white" }) })) : !isPlaying ? (_jsx(PlayButtonIcon, {})) : (_jsx(_Fragment, {})) }), !isPlaying && (_jsx(Fill, { style: [
                    t.name === 'light' ? t.atoms.bg_contrast_975 : t.atoms.bg,
                    {
                        opacity: 0.2,
                        zIndex: 1,
                    },
                ] })), _jsx(View, { style: styles.gifBadgeContainer, children: _jsx(Text, { style: [{ color: 'white' }, a.font_bold, a.text_xs], children: _jsx(Trans, { children: "GIF" }) }) }), altText && _jsx(AltBadge, { text: altText })] }));
}
function AltBadge(_a) {
    var text = _a.text;
    var control = Prompt.usePromptControl();
    var _ = useLingui()._;
    return (_jsxs(_Fragment, { children: [_jsx(TouchableOpacity, { testID: "altTextButton", accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Show alt text"], ["Show alt text"])))), accessibilityHint: "", hitSlop: HITSLOP_20, onPress: control.open, style: styles.altBadgeContainer, children: _jsx(Text, { style: [{ color: 'white' }, a.font_bold, a.text_xs], accessible: false, children: _jsx(Trans, { children: "ALT" }) }) }), _jsxs(Prompt.Outer, { control: control, children: [_jsxs(Prompt.Content, { children: [_jsx(Prompt.TitleText, { children: _jsx(Trans, { children: "Alt Text" }) }), _jsx(Prompt.DescriptionText, { selectable: true, children: text })] }), _jsx(Prompt.Actions, { children: _jsx(Prompt.Action, { onPress: function () { return control.close(); }, cta: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Close"], ["Close"])))), color: "secondary" }) })] })] }));
}
var styles = StyleSheet.create({
    gifBadgeContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderRadius: 6,
        paddingHorizontal: 4,
        paddingVertical: 3,
        position: 'absolute',
        left: 6,
        bottom: 6,
        zIndex: 2,
    },
    altBadgeContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderRadius: 6,
        paddingHorizontal: 4,
        paddingVertical: 3,
        position: 'absolute',
        right: 6,
        bottom: 6,
        zIndex: 2,
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
