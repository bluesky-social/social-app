import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StyleSheet } from 'react-native';
import { FontAwesomeIcon, } from '@fortawesome/react-native-fontawesome';
import { usePalette } from '#/lib/hooks/usePalette';
import { Button } from './forms/Button';
import { Text } from './text/Text';
export function LoadMoreRetryBtn(_a) {
    var label = _a.label, onPress = _a.onPress;
    var pal = usePalette('default');
    return (_jsxs(Button, { type: "default-light", onPress: onPress, style: styles.loadMoreRetry, children: [_jsx(FontAwesomeIcon, { icon: "arrow-rotate-left", style: pal.textLight, size: 18 }), _jsx(Text, { style: [pal.textLight, styles.label], children: label })] }));
}
var styles = StyleSheet.create({
    loadMoreRetry: {
        flexDirection: 'row',
        gap: 14,
        alignItems: 'center',
        borderRadius: 0,
        marginTop: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    label: {
        flex: 1,
    },
});
