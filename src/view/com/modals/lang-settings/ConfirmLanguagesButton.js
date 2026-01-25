var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { usePalette } from '#/lib/hooks/usePalette';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { colors, gradients, s } from '#/lib/styles';
export var ConfirmLanguagesButton = function (_a) {
    var onPress = _a.onPress, extraText = _a.extraText;
    var pal = usePalette('default');
    var _ = useLingui()._;
    var isMobile = useWebMediaQueries().isMobile;
    return (_jsx(View, { style: [
            styles.btnContainer,
            pal.borderDark,
            isMobile && {
                paddingBottom: 40,
                borderTopWidth: 1,
            },
        ], children: _jsx(Pressable, { testID: "confirmContentLanguagesBtn", onPress: onPress, accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Confirm content language settings"], ["Confirm content language settings"])))), accessibilityHint: "", children: _jsx(LinearGradient, { colors: [gradients.blueLight.start, gradients.blueLight.end], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, style: [styles.btn], children: _jsx(Text, { style: [s.white, s.bold, s.f18], children: _jsxs(Trans, { children: ["Done", extraText] }) }) }) }) }));
};
var styles = StyleSheet.create({
    btnContainer: {
        paddingTop: 10,
        paddingHorizontal: 10,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        borderRadius: 32,
        padding: 14,
        backgroundColor: colors.gray1,
    },
});
var templateObject_1;
