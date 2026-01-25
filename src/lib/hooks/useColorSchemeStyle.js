import { useTheme } from '#/lib/ThemeContext';
export function useColorSchemeStyle(lightStyle, darkStyle) {
    var colorScheme = useTheme().colorScheme;
    return colorScheme === 'dark' ? darkStyle : lightStyle;
}
