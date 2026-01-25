var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/core';
import { FEEDBACK_FORM_URL, HELP_DESK_URL } from '#/lib/constants';
import { useKawaiiMode } from '#/state/preferences/kawaii';
import { useSession } from '#/state/session';
import { DesktopFeeds } from '#/view/shell/desktop/Feeds';
import { DesktopSearch } from '#/view/shell/desktop/Search';
import { SidebarTrendingTopics } from '#/view/shell/desktop/SidebarTrendingTopics';
import { atoms as a, useGutters, useLayoutBreakpoints, useTheme, web, } from '#/alf';
import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { CENTER_COLUMN_OFFSET } from '#/components/Layout';
import { InlineLinkText } from '#/components/Link';
import { ProgressGuideList } from '#/components/ProgressGuide/List';
import { Text } from '#/components/Typography';
import { SidebarLiveEventFeedsBanner } from '#/features/liveEvents/components/SidebarLiveEventFeedsBanner';
function useWebQueryParams() {
    var navigation = useNavigation();
    var _a = useState({}), params = _a[0], setParams = _a[1];
    useEffect(function () {
        return navigation.addListener('state', function (e) {
            try {
                var state = e.data.state;
                var lastRoute = state.routes[state.routes.length - 1];
                setParams(lastRoute.params);
            }
            catch (err) { }
        });
    }, [navigation, setParams]);
    return params;
}
export function DesktopRightNav(_a) {
    var routeName = _a.routeName;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = useSession(), hasSession = _b.hasSession, currentAccount = _b.currentAccount;
    var kawaii = useKawaiiMode();
    var gutters = useGutters(['base', 0, 'base', 'wide']);
    var isSearchScreen = routeName === 'Search';
    var webqueryParams = useWebQueryParams();
    var searchQuery = webqueryParams === null || webqueryParams === void 0 ? void 0 : webqueryParams.q;
    var showExploreScreenDuplicatedContent = !isSearchScreen || (isSearchScreen && !!searchQuery);
    var _c = useLayoutBreakpoints(), rightNavVisible = _c.rightNavVisible, centerColumnOffset = _c.centerColumnOffset, leftNavMinimal = _c.leftNavMinimal;
    if (!rightNavVisible) {
        return null;
    }
    var width = centerColumnOffset ? 250 : 300;
    return (_jsxs(View, { style: [
            gutters,
            a.gap_lg,
            a.pr_2xs,
            web({
                position: 'fixed',
                left: '50%',
                transform: __spreadArray([
                    {
                        translateX: 300 + (centerColumnOffset ? CENTER_COLUMN_OFFSET : 0),
                    }
                ], a.scrollbar_offset.transform, true),
                /**
                 * Compensate for the right padding above (2px) to retain intended width.
                 */
                width: width + gutters.paddingLeft + 2,
                maxHeight: '100vh',
            }),
        ], children: [!isSearchScreen && _jsx(DesktopSearch, {}), hasSession && (_jsxs(_Fragment, { children: [_jsx(DesktopFeeds, {}), _jsx(ProgressGuideList, {})] })), showExploreScreenDuplicatedContent && _jsx(SidebarLiveEventFeedsBanner, {}), showExploreScreenDuplicatedContent && _jsx(SidebarTrendingTopics, {}), _jsxs(Text, { style: [a.leading_snug, t.atoms.text_contrast_low], children: [hasSession && (_jsxs(_Fragment, { children: [_jsx(InlineLinkText, { to: FEEDBACK_FORM_URL({
                                    email: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.email,
                                    handle: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.handle,
                                }), style: [t.atoms.text_contrast_medium], label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Feedback"], ["Feedback"])))), children: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Feedback"], ["Feedback"])))) }), _jsx(Text, { style: [t.atoms.text_contrast_low], children: ' ∙ ' })] })), _jsx(InlineLinkText, { to: "https://bsky.social/about/support/privacy-policy", style: [t.atoms.text_contrast_medium], label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Privacy"], ["Privacy"])))), children: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Privacy"], ["Privacy"])))) }), _jsx(Text, { style: [t.atoms.text_contrast_low], children: ' ∙ ' }), _jsx(InlineLinkText, { to: "https://bsky.social/about/support/tos", style: [t.atoms.text_contrast_medium], label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Terms"], ["Terms"])))), children: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Terms"], ["Terms"])))) }), _jsx(Text, { style: [t.atoms.text_contrast_low], children: ' ∙ ' }), _jsx(InlineLinkText, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Help"], ["Help"])))), to: HELP_DESK_URL, style: [t.atoms.text_contrast_medium], children: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Help"], ["Help"])))) })] }), kawaii && (_jsx(Text, { style: [t.atoms.text_contrast_medium, { marginTop: 12 }], children: _jsxs(Trans, { children: ["Logo by", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Logo by @sawaratsuki.bsky.social"], ["Logo by @sawaratsuki.bsky.social"])))), to: "/profile/sawaratsuki.bsky.social", children: "@sawaratsuki.bsky.social" })] }) })), !hasSession && leftNavMinimal && (_jsx(View, { style: [a.w_full, { height: 32 }], children: _jsx(AppLanguageDropdown, {}) }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
