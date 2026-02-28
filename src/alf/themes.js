import { createThemes, DEFAULT_PALETTE, DEFAULT_SUBDUED_PALETTE, } from '@bsky.app/alf';
var DEFAULT_THEMES = createThemes({
    defaultPalette: DEFAULT_PALETTE,
    subduedPalette: DEFAULT_SUBDUED_PALETTE,
});
export var themes = {
    lightPalette: DEFAULT_THEMES.light.palette,
    darkPalette: DEFAULT_THEMES.dark.palette,
    dimPalette: DEFAULT_THEMES.dim.palette,
    light: DEFAULT_THEMES.light,
    dark: DEFAULT_THEMES.dark,
    dim: DEFAULT_THEMES.dim,
};
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export var lightPalette = DEFAULT_THEMES.light.palette;
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export var darkPalette = DEFAULT_THEMES.dark.palette;
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export var dimPalette = DEFAULT_THEMES.dim.palette;
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export var light = DEFAULT_THEMES.light;
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export var dark = DEFAULT_THEMES.dark;
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export var dim = DEFAULT_THEMES.dim;
