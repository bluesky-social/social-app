import { jsx as _jsx } from "react/jsx-runtime";
import { Provider as AltTextRequiredProvider } from './alt-text-required';
import { Provider as AutoplayProvider } from './autoplay';
import { Provider as DisableHapticsProvider } from './disable-haptics';
import { Provider as ExternalEmbedsProvider } from './external-embeds-prefs';
import { Provider as HiddenPostsProvider } from './hidden-posts';
import { Provider as InAppBrowserProvider } from './in-app-browser';
import { Provider as KawaiiProvider } from './kawaii';
import { Provider as LanguagesProvider } from './languages';
import { Provider as LargeAltBadgeProvider } from './large-alt-badge';
import { Provider as SubtitlesProvider } from './subtitles';
import { Provider as TrendingSettingsProvider } from './trending';
import { Provider as UsedStarterPacksProvider } from './used-starter-packs';
export { useRequireAltTextEnabled, useSetRequireAltTextEnabled, } from './alt-text-required';
export { useAutoplayDisabled, useSetAutoplayDisabled } from './autoplay';
export { useHapticsDisabled, useSetHapticsDisabled } from './disable-haptics';
export { useExternalEmbedsPrefs, useSetExternalEmbedPref, } from './external-embeds-prefs';
export { useHiddenPosts, useHiddenPostsApi } from './hidden-posts';
export { useLabelDefinitions } from './label-defs';
export { useLanguagePrefs, useLanguagePrefsApi } from './languages';
export { useSetSubtitlesEnabled, useSubtitlesEnabled } from './subtitles';
export function Provider(_a) {
    var children = _a.children;
    return (_jsx(LanguagesProvider, { children: _jsx(AltTextRequiredProvider, { children: _jsx(LargeAltBadgeProvider, { children: _jsx(ExternalEmbedsProvider, { children: _jsx(HiddenPostsProvider, { children: _jsx(InAppBrowserProvider, { children: _jsx(DisableHapticsProvider, { children: _jsx(AutoplayProvider, { children: _jsx(UsedStarterPacksProvider, { children: _jsx(SubtitlesProvider, { children: _jsx(TrendingSettingsProvider, { children: _jsx(KawaiiProvider, { children: children }) }) }) }) }) }) }) }) }) }) }) }));
}
