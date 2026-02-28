var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AppBskyGraphDefs, AppBskyGraphStarterpack, AtUri, } from '@atproto/api';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { JOINED_THIS_WEEK } from '#/lib/constants';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { createStarterPackGooglePlayUri } from '#/lib/strings/starter-pack';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useStarterPackQuery } from '#/state/queries/starter-packs';
import { useActiveStarterPack, useSetActiveStarterPack, } from '#/state/shell/starter-pack';
import { LoggedOutScreenState } from '#/view/com/auth/LoggedOut';
import { formatCount } from '#/view/com/util/numeric/format';
import { Logo } from '#/view/icons/Logo';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import * as FeedCard from '#/components/FeedCard';
import { useRichText } from '#/components/hooks/useRichText';
import * as Layout from '#/components/Layout';
import { LinearGradientBackground } from '#/components/LinearGradientBackground';
import { ListMaybePlaceholder } from '#/components/Lists';
import { Default as ProfileCard } from '#/components/ProfileCard';
import * as Prompt from '#/components/Prompt';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_WEB, IS_WEB_MOBILE_ANDROID } from '#/env';
import * as bsky from '#/types/bsky';
var AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export function postAppClipMessage(message) {
    // @ts-expect-error safari webview only
    window.webkit.messageHandlers.onMessage.postMessage(JSON.stringify(message));
}
export function LandingScreen(_a) {
    var setScreenState = _a.setScreenState;
    var moderationOpts = useModerationOpts();
    var activeStarterPack = useActiveStarterPack();
    var _b = useStarterPackQuery({
        uri: activeStarterPack === null || activeStarterPack === void 0 ? void 0 : activeStarterPack.uri,
    }), starterPack = _b.data, isErrorStarterPack = _b.isError, isFetching = _b.isFetching;
    var isValid = starterPack &&
        starterPack.list &&
        AppBskyGraphDefs.validateStarterPackView(starterPack) &&
        AppBskyGraphStarterpack.validateRecord(starterPack.record);
    React.useEffect(function () {
        if (isErrorStarterPack || (starterPack && !isValid)) {
            setScreenState(LoggedOutScreenState.S_LoginOrCreateAccount);
        }
    }, [isErrorStarterPack, setScreenState, isValid, starterPack]);
    if (isFetching || !starterPack || !isValid || !moderationOpts) {
        return _jsx(ListMaybePlaceholder, { isLoading: true });
    }
    // Just for types, this cannot be hit
    if (!bsky.dangerousIsType(starterPack.record, AppBskyGraphStarterpack.isRecord)) {
        return null;
    }
    return (_jsx(LandingScreenLoaded, { starterPack: starterPack, starterPackRecord: starterPack.record, setScreenState: setScreenState, moderationOpts: moderationOpts }));
}
function LandingScreenLoaded(_a) {
    var _b, _c, _d;
    var starterPack = _a.starterPack, record = _a.starterPackRecord, setScreenState = _a.setScreenState, 
    // TODO apply this to profile card
    moderationOpts = _a.moderationOpts;
    var creator = starterPack.creator, listItemsSample = starterPack.listItemsSample, feeds = starterPack.feeds;
    var _e = useLingui(), _ = _e._, i18n = _e.i18n;
    var ax = useAnalytics();
    var t = useTheme();
    var activeStarterPack = useActiveStarterPack();
    var setActiveStarterPack = useSetActiveStarterPack();
    var isTabletOrDesktop = useWebMediaQueries().isTabletOrDesktop;
    var androidDialogControl = useDialogControl();
    var descriptionRt = useRichText(record.description || '')[0];
    var _f = React.useState(false), appClipOverlayVisible = _f[0], setAppClipOverlayVisible = _f[1];
    var listItemsCount = (_c = (_b = starterPack.list) === null || _b === void 0 ? void 0 : _b.listItemCount) !== null && _c !== void 0 ? _c : 0;
    var onContinue = function () {
        setScreenState(LoggedOutScreenState.S_CreateAccount);
    };
    var onJoinPress = function () {
        if (activeStarterPack === null || activeStarterPack === void 0 ? void 0 : activeStarterPack.isClip) {
            setAppClipOverlayVisible(true);
            postAppClipMessage({
                action: 'present',
            });
        }
        else if (IS_WEB_MOBILE_ANDROID) {
            androidDialogControl.open();
        }
        else {
            onContinue();
        }
        ax.metric('starterPack:ctaPress', {
            starterPack: starterPack.uri,
        });
    };
    var onJoinWithoutPress = function () {
        if (activeStarterPack === null || activeStarterPack === void 0 ? void 0 : activeStarterPack.isClip) {
            setAppClipOverlayVisible(true);
            postAppClipMessage({
                action: 'present',
            });
        }
        else {
            setActiveStarterPack(undefined);
            setScreenState(LoggedOutScreenState.S_CreateAccount);
        }
    };
    return (_jsxs(View, { style: [a.flex_1], children: [_jsxs(Layout.Content, { ignoreTabletLayoutOffset: true, children: [_jsxs(LinearGradientBackground, { style: [
                            a.align_center,
                            a.gap_sm,
                            a.px_lg,
                            a.py_2xl,
                            isTabletOrDesktop && [a.mt_2xl, a.rounded_md],
                            (activeStarterPack === null || activeStarterPack === void 0 ? void 0 : activeStarterPack.isClip) && {
                                paddingTop: 100,
                            },
                        ], children: [_jsx(View, { style: [a.flex_row, a.gap_md, a.pb_sm], children: _jsx(Logo, { width: 76, fill: "white" }) }), _jsx(Text, { style: [
                                    a.font_semi_bold,
                                    a.text_4xl,
                                    a.text_center,
                                    a.leading_tight,
                                    { color: 'white' },
                                ], children: record.name }), _jsxs(Text, { style: [
                                    a.text_center,
                                    a.font_semi_bold,
                                    a.text_md,
                                    { color: 'white' },
                                ], children: ["Starter pack by ", "@".concat(creator.handle)] })] }), _jsxs(View, { style: [a.gap_2xl, a.mx_lg, a.my_2xl], children: [record.description ? (_jsx(RichText, { value: descriptionRt, style: [a.text_md] })) : null, _jsxs(View, { style: [a.gap_sm], children: [_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Join Bluesky"], ["Join Bluesky"])))), onPress: onJoinPress, variant: "solid", color: "primary", size: "large", children: _jsx(ButtonText, { style: [a.text_lg], children: _jsx(Trans, { children: "Join Bluesky" }) }) }), _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_sm], children: [_jsx(FontAwesomeIcon, { icon: "arrow-trend-up", size: 12, color: t.atoms.text_contrast_medium.color }), _jsx(Text, { style: [
                                                    a.font_semi_bold,
                                                    a.text_sm,
                                                    t.atoms.text_contrast_medium,
                                                ], numberOfLines: 1, children: _jsxs(Trans, { children: [formatCount(i18n, JOINED_THIS_WEEK), " joined this week"] }) })] })] }), _jsxs(View, { style: [a.gap_3xl], children: [Boolean(listItemsSample === null || listItemsSample === void 0 ? void 0 : listItemsSample.length) && (_jsxs(View, { style: [a.gap_md], children: [_jsx(Text, { style: [a.font_bold, a.text_lg], children: listItemsCount <= 8 ? (_jsx(Trans, { children: "You'll follow these people right away" })) : (_jsxs(Trans, { children: ["You'll follow these people and ", listItemsCount - 8, " others"] })) }), _jsx(View, { style: isTabletOrDesktop && [
                                                    a.border,
                                                    a.rounded_md,
                                                    t.atoms.border_contrast_low,
                                                ], children: (_d = starterPack.listItemsSample) === null || _d === void 0 ? void 0 : _d.filter(function (p) { var _a; return !((_a = p.subject.associated) === null || _a === void 0 ? void 0 : _a.labeler); }).slice(0, 8).map(function (item, i) { return (_jsx(View, { style: [
                                                        a.py_lg,
                                                        a.px_md,
                                                        (!isTabletOrDesktop || i !== 0) && a.border_t,
                                                        t.atoms.border_contrast_low,
                                                        { pointerEvents: 'none' },
                                                    ], children: _jsx(ProfileCard, { profile: item.subject, moderationOpts: moderationOpts }) }, item.subject.did)); }) })] })), (feeds === null || feeds === void 0 ? void 0 : feeds.length) ? (_jsxs(View, { style: [a.gap_md], children: [_jsx(Text, { style: [a.font_bold, a.text_lg], children: _jsx(Trans, { children: "You'll stay updated with these feeds" }) }), _jsx(View, { style: [
                                                    { pointerEvents: 'none' },
                                                    isTabletOrDesktop && [
                                                        a.border,
                                                        a.rounded_md,
                                                        t.atoms.border_contrast_low,
                                                    ],
                                                ], children: feeds === null || feeds === void 0 ? void 0 : feeds.map(function (feed, i) { return (_jsx(View, { style: [
                                                        a.py_lg,
                                                        a.px_md,
                                                        (!isTabletOrDesktop || i !== 0) && a.border_t,
                                                        t.atoms.border_contrast_low,
                                                    ], children: _jsx(FeedCard.Default, { view: feed }) }, feed.uri)); }) })] })) : null] }), _jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Create an account without using this starter pack"], ["Create an account without using this starter pack"])))), variant: "solid", color: "secondary", size: "large", style: [a.py_lg], onPress: onJoinWithoutPress, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Create an account without using this starter pack" }) }) })] })] }), _jsx(AppClipOverlay, { visible: appClipOverlayVisible, setIsVisible: setAppClipOverlayVisible }), _jsxs(Prompt.Outer, { control: androidDialogControl, children: [_jsxs(Prompt.Content, { children: [_jsx(Prompt.TitleText, { children: _jsx(Trans, { children: "Download Bluesky" }) }), _jsx(Prompt.DescriptionText, { children: _jsx(Trans, { children: "The experience is better in the app. Download Bluesky now and we'll pick back up where you left off." }) })] }), _jsxs(Prompt.Actions, { children: [_jsx(Prompt.Action, { cta: "Download on Google Play", color: "primary", onPress: function () {
                                    var rkey = new AtUri(starterPack.uri).rkey;
                                    if (!rkey)
                                        return;
                                    var googlePlayUri = createStarterPackGooglePlayUri(creator.handle, rkey);
                                    if (!googlePlayUri)
                                        return;
                                    window.location.href = googlePlayUri;
                                } }), _jsx(Prompt.Action, { cta: "Continue on web", color: "secondary", onPress: onContinue })] })] }), IS_WEB && (_jsx("meta", { name: "apple-itunes-app", content: "app-id=xyz.blueskyweb.app, app-clip-bundle-id=xyz.blueskyweb.app.AppClip, app-clip-display=card" }))] }));
}
export function AppClipOverlay(_a) {
    var visible = _a.visible, setIsVisible = _a.setIsVisible;
    if (!visible)
        return;
    return (_jsx(AnimatedPressable, { accessibilityRole: "button", style: [
            a.absolute,
            a.inset_0,
            {
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                zIndex: 1,
            },
        ], entering: FadeIn, exiting: FadeOut, onPress: function () { return setIsVisible(false); }, children: _jsx(View, { style: [a.flex_1, a.px_lg, { marginTop: 250 }], children: _jsxs(View, { style: [a.gap_md, { zIndex: 2 }], children: [_jsx(Text, { style: [
                            a.font_semi_bold,
                            a.text_4xl,
                            { lineHeight: 40, color: 'white' },
                        ], children: "Download Bluesky to get started!" }), _jsx(Text, { style: [a.text_lg, { color: 'white' }], children: "We'll remember the starter pack you chose and use it when you create an account in the app." })] }) }) }));
}
var templateObject_1, templateObject_2;
