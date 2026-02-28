import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StyleSheet, View } from 'react-native';
import { usePalette } from '#/lib/hooks/usePalette';
import { InfoCircleIcon } from '#/lib/icons';
import { Text } from '#/view/com/util/text/Text';
import { atoms as a, useTheme } from '#/alf';
export function PostPlaceholder(_a) {
    var children = _a.children;
    var t = useTheme();
    var pal = usePalette('default');
    return (_jsxs(View, { style: [styles.errorContainer, a.border, t.atoms.border_contrast_low], children: [_jsx(InfoCircleIcon, { size: 18, style: pal.text }), _jsx(Text, { type: "lg", style: pal.text, children: children })] }));
}
var styles = StyleSheet.create({
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 8,
        marginTop: 8,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderWidth: StyleSheet.hairlineWidth,
    },
});
