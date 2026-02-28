var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useAutoplayDisabled, useSetAutoplayDisabled } from '#/state/preferences';
import { useInAppBrowser, useSetInAppBrowser, } from '#/state/preferences/in-app-browser';
import { useTrendingSettings, useTrendingSettingsApi, } from '#/state/preferences/trending';
import { useTrendingConfig } from '#/state/service-config';
import * as SettingsList from '#/screens/Settings/components/SettingsList';
import * as Toggle from '#/components/forms/Toggle';
import { Bubbles_Stroke2_Corner2_Rounded as BubblesIcon } from '#/components/icons/Bubble';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { Hashtag_Stroke2_Corner0_Rounded as HashtagIcon } from '#/components/icons/Hashtag';
import { Home_Stroke2_Corner2_Rounded as HomeIcon } from '#/components/icons/Home';
import { Macintosh_Stroke2_Corner2_Rounded as MacintoshIcon } from '#/components/icons/Macintosh';
import { Play_Stroke2_Corner2_Rounded as PlayIcon } from '#/components/icons/Play';
import { Trending2_Stroke2_Corner2_Rounded as Graph } from '#/components/icons/Trending';
import { Window_Stroke2_Corner2_Rounded as WindowIcon } from '#/components/icons/Window';
import * as Layout from '#/components/Layout';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
export function ContentAndMediaSettingsScreen(_a) {
    var _ = useLingui()._;
    var ax = useAnalytics();
    var autoplayDisabledPref = useAutoplayDisabled();
    var setAutoplayDisabledPref = useSetAutoplayDisabled();
    var inAppBrowserPref = useInAppBrowser();
    var setUseInAppBrowser = useSetInAppBrowser();
    var trendingEnabled = useTrendingConfig().enabled;
    var _b = useTrendingSettings(), trendingDisabled = _b.trendingDisabled, trendingVideoDisabled = _b.trendingVideoDisabled;
    var _c = useTrendingSettingsApi(), setTrendingDisabled = _c.setTrendingDisabled, setTrendingVideoDisabled = _c.setTrendingVideoDisabled;
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Content & Media" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(SettingsList.Container, { children: [_jsxs(SettingsList.LinkItem, { to: "/settings/saved-feeds", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Manage saved feeds"], ["Manage saved feeds"])))), children: [_jsx(SettingsList.ItemIcon, { icon: HashtagIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Manage saved feeds" }) })] }), _jsxs(SettingsList.LinkItem, { to: "/settings/threads", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Thread preferences"], ["Thread preferences"])))), children: [_jsx(SettingsList.ItemIcon, { icon: BubblesIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Thread preferences" }) })] }), _jsxs(SettingsList.LinkItem, { to: "/settings/following-feed", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Following feed preferences"], ["Following feed preferences"])))), children: [_jsx(SettingsList.ItemIcon, { icon: HomeIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Following feed preferences" }) })] }), _jsxs(SettingsList.LinkItem, { to: "/settings/external-embeds", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["External media"], ["External media"])))), children: [_jsx(SettingsList.ItemIcon, { icon: MacintoshIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "External media" }) })] }), _jsxs(SettingsList.LinkItem, { to: "/settings/interests", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Your interests"], ["Your interests"])))), children: [_jsx(SettingsList.ItemIcon, { icon: CircleInfo }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Your interests" }) })] }), _jsx(SettingsList.Divider, {}), IS_NATIVE && (_jsx(Toggle.Item, { name: "use_in_app_browser", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Use in-app browser to open links"], ["Use in-app browser to open links"])))), value: inAppBrowserPref !== null && inAppBrowserPref !== void 0 ? inAppBrowserPref : false, onChange: function (value) { return setUseInAppBrowser(value); }, children: _jsxs(SettingsList.Item, { children: [_jsx(SettingsList.ItemIcon, { icon: WindowIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Use in-app browser to open links" }) }), _jsx(Toggle.Platform, {})] }) })), _jsx(Toggle.Item, { name: "disable_autoplay", label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Autoplay videos and GIFs"], ["Autoplay videos and GIFs"])))), value: !autoplayDisabledPref, onChange: function (value) { return setAutoplayDisabledPref(!value); }, children: _jsxs(SettingsList.Item, { children: [_jsx(SettingsList.ItemIcon, { icon: PlayIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Autoplay videos and GIFs" }) }), _jsx(Toggle.Platform, {})] }) }), trendingEnabled ? (_jsxs(_Fragment, { children: [_jsx(SettingsList.Divider, {}), _jsx(Toggle.Item, { name: "show_trending_topics", label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Enable trending topics"], ["Enable trending topics"])))), value: !trendingDisabled, onChange: function (value) {
                                        var hide = Boolean(!value);
                                        if (hide) {
                                            ax.metric('trendingTopics:hide', { context: 'settings' });
                                        }
                                        else {
                                            ax.metric('trendingTopics:show', { context: 'settings' });
                                        }
                                        setTrendingDisabled(hide);
                                    }, children: _jsxs(SettingsList.Item, { children: [_jsx(SettingsList.ItemIcon, { icon: Graph }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Enable trending topics" }) }), _jsx(Toggle.Platform, {})] }) }), _jsx(Toggle.Item, { name: "show_trending_videos", label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Enable trending videos in your Discover feed"], ["Enable trending videos in your Discover feed"])))), value: !trendingVideoDisabled, onChange: function (value) {
                                        var hide = Boolean(!value);
                                        if (hide) {
                                            ax.metric('trendingVideos:hide', { context: 'settings' });
                                        }
                                        else {
                                            ax.metric('trendingVideos:show', { context: 'settings' });
                                        }
                                        setTrendingVideoDisabled(hide);
                                    }, children: _jsxs(SettingsList.Item, { children: [_jsx(SettingsList.ItemIcon, { icon: Graph }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Enable trending videos in your Discover feed" }) }), _jsx(Toggle.Platform, {})] }) })] })) : null] }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
