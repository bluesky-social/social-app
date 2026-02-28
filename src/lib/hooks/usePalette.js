import { useMemo } from 'react';
import { useTheme, } from '../ThemeContext';
/**
 * @deprecated use `useTheme` from `#/alf`
 */
export function usePalette(color) {
    var theme = useTheme();
    return useMemo(function () {
        var palette = theme.palette[color];
        return {
            colors: palette,
            view: {
                backgroundColor: palette.background,
            },
            viewLight: {
                backgroundColor: palette.backgroundLight,
            },
            btn: {
                backgroundColor: palette.backgroundLight,
            },
            border: {
                borderColor: palette.border,
            },
            borderDark: {
                borderColor: palette.borderDark,
            },
            text: {
                color: palette.text,
            },
            textLight: {
                color: palette.textLight,
            },
            textInverted: {
                color: palette.textInverted,
            },
            link: {
                color: palette.link,
            },
            icon: {
                color: palette.icon,
            },
        };
    }, [theme, color]);
}
