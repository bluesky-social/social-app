var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StyleSheet, TouchableOpacity, View, } from 'react-native';
import { FontAwesomeIcon, } from '@fortawesome/react-native-fontawesome';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { usePalette } from '#/lib/hooks/usePalette';
import { useTheme } from '#/lib/ThemeContext';
import * as Layout from '#/components/Layout';
import { Text } from '../text/Text';
export function ErrorMessage(_a) {
    var message = _a.message, numberOfLines = _a.numberOfLines, style = _a.style, onPressTryAgain = _a.onPressTryAgain;
    var theme = useTheme();
    var pal = usePalette('error');
    var _ = useLingui()._;
    return (_jsx(Layout.Center, { children: _jsxs(View, { testID: "errorMessageView", style: [styles.outer, pal.view, style], children: [_jsx(View, { style: [
                        styles.errorIcon,
                        { backgroundColor: theme.palette.error.icon },
                    ], children: _jsx(FontAwesomeIcon, { icon: "exclamation", style: pal.text, size: 16 }) }), _jsx(Text, { type: "sm-medium", style: [styles.message, pal.text], numberOfLines: numberOfLines, children: message }), onPressTryAgain && (_jsx(TouchableOpacity, { testID: "errorMessageTryAgainButton", style: styles.btn, onPress: onPressTryAgain, accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Retry"], ["Retry"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Retries the last action, which errored out"], ["Retries the last action, which errored out"])))), children: _jsx(FontAwesomeIcon, { icon: "arrows-rotate", style: { color: theme.palette.error.icon }, size: 18 }) }))] }) }));
}
var styles = StyleSheet.create({
    outer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    errorIcon: {
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    message: {
        flex: 1,
        paddingRight: 10,
    },
    btn: {
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
});
var templateObject_1, templateObject_2;
