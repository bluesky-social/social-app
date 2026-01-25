import { IS_ANDROID, IS_WEB } from '#/env';
import { device } from '#/storage';
var WEB_FONT_FAMILIES = "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\"";
var factor = 0.0625; // 1 - (15/16)
var fontScaleMultipliers = {
    '-2': 1 - factor * 1, // unused
    '-1': 1 - factor * 1,
    '0': 1, // default
    '1': 1 + factor * 1,
    '2': 1 + factor * 1, // unused
};
export function computeFontScaleMultiplier(scale) {
    return fontScaleMultipliers[scale];
}
export function getFontScale() {
    var _a;
    return (_a = device.get(['fontScale'])) !== null && _a !== void 0 ? _a : '0';
}
export function setFontScale(fontScale) {
    device.set(['fontScale'], fontScale);
}
export function getFontFamily() {
    return device.get(['fontFamily']) || 'theme';
}
export function setFontFamily(fontFamily) {
    device.set(['fontFamily'], fontFamily);
}
/*
 * Unused fonts are commented out, but the files are there if we need them.
 */
export function applyFonts(style, fontFamily) {
    if (fontFamily === 'theme') {
        if (IS_ANDROID) {
            style.fontFamily =
                {
                    400: 'Inter-Regular',
                    500: 'Inter-Medium',
                    600: 'Inter-SemiBold',
                    700: 'Inter-Bold',
                    800: 'Inter-Bold',
                    900: 'Inter-Bold',
                }[String(style.fontWeight || '400')] || 'Inter-Regular';
            if (style.fontStyle === 'italic') {
                if (style.fontFamily === 'Inter-Regular') {
                    style.fontFamily = 'Inter-Italic';
                }
                else {
                    style.fontFamily += 'Italic';
                }
            }
            /*
             * These are not supported on Android and actually break the styling.
             */
            delete style.fontWeight;
            delete style.fontStyle;
        }
        else {
            style.fontFamily = 'InterVariable';
            if (style.fontStyle === 'italic') {
                style.fontFamily += 'Italic';
            }
        }
        if (IS_WEB) {
            // fallback families only supported on web
            style.fontFamily += ", ".concat(WEB_FONT_FAMILIES);
        }
        /**
         * Disable contextual alternates in Inter
         * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant}
         */
        style.fontVariant = (style.fontVariant || []).concat('no-contextual');
    }
    else {
        // fallback families only supported on web
        if (IS_WEB) {
            style.fontFamily = style.fontFamily || WEB_FONT_FAMILIES;
        }
        /**
         * Overridden to previous spacing for the `system` font option.
         * https://github.com/bluesky-social/social-app/commit/2419096e2409008b7d71fd6b8f8d0dd5b016e267
         */
        style.letterSpacing = 0.25;
    }
}
/**
 * Here only for bundling purposes, not actually used.
 */
export { DO_NOT_USE } from '#/alf/util/unusedUseFonts';
