var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { useKawaiiMode } from '#/state/preferences/kawaii';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';
import { Logo } from '#/view/icons/Logo';
import { Logotype } from '#/view/icons/Logotype';
import { AppClipOverlay, postAppClipMessage, } from '#/screens/StarterPack/StarterPackLandingScreen';
import { atoms as a, useTheme } from '#/alf';
import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { Button, ButtonText } from '#/components/Button';
import * as Layout from '#/components/Layout';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';
export var SplashScreen = function (_a) {
    var onDismiss = _a.onDismiss, onPressSignin = _a.onPressSignin, onPressCreateAccount = _a.onPressCreateAccount;
    var _ = useLingui()._;
    var t = useTheme();
    var IS_WEB_MOBILE = useWebMediaQueries().isTabletOrMobile;
    var _b = React.useState(false), showClipOverlay = _b[0], setShowClipOverlay = _b[1];
    React.useEffect(function () {
        var getParams = new URLSearchParams(window.location.search);
        var clip = getParams.get('clip');
        if (clip === 'true') {
            setShowClipOverlay(true);
            postAppClipMessage({
                action: 'present',
            });
        }
    }, []);
    var kawaii = useKawaiiMode();
    return (_jsxs(_Fragment, { children: [onDismiss && (_jsx(Pressable, { accessibilityRole: "button", style: {
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    padding: 20,
                    zIndex: 100,
                }, onPress: onDismiss, children: _jsx(FontAwesomeIcon, { icon: "x", size: 24, style: {
                        color: String(t.atoms.text.color),
                    } }) })), _jsxs(Layout.Center, { style: [a.h_full, a.flex_1], ignoreTabletLayoutOffset: true, children: [_jsx(View, { testID: "noSessionView", style: [
                            a.h_full,
                            a.justify_center,
                            // @ts-expect-error web only
                            { paddingBottom: '20vh' },
                            IS_WEB_MOBILE && a.pb_5xl,
                            t.atoms.border_contrast_medium,
                            a.align_center,
                            a.gap_5xl,
                            a.flex_1,
                        ], children: _jsxs(ErrorBoundary, { children: [_jsxs(View, { style: [a.justify_center, a.align_center], children: [_jsx(Logo, { width: kawaii ? 300 : 92, fill: "sky" }), !kawaii && (_jsx(View, { style: [a.pb_sm, a.pt_5xl], children: _jsx(Logotype, { width: 161, fill: t.atoms.text.color }) })), _jsx(Text, { style: [
                                                a.text_md,
                                                a.font_semi_bold,
                                                t.atoms.text_contrast_medium,
                                            ], children: _jsx(Trans, { children: "What's up?" }) })] }), _jsxs(View, { testID: "signinOrCreateAccount", style: [a.w_full, a.px_xl, a.gap_md, a.pb_2xl, { maxWidth: 320 }], children: [_jsx(Button, { testID: "createAccountButton", onPress: onPressCreateAccount, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Create new account"], ["Create new account"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Opens flow to create a new Bluesky account"], ["Opens flow to create a new Bluesky account"])))), size: "large", variant: "solid", color: "primary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Create account" }) }) }), _jsx(Button, { testID: "signInButton", onPress: onPressSignin, label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Sign in"], ["Sign in"])))), accessibilityHint: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Opens flow to sign in to your existing Bluesky account"], ["Opens flow to sign in to your existing Bluesky account"])))), size: "large", variant: "solid", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Sign in" }) }) })] })] }) }), _jsx(Footer, {})] }), _jsx(AppClipOverlay, { visible: showClipOverlay, setIsVisible: setShowClipOverlay })] }));
};
function Footer() {
    var t = useTheme();
    var _ = useLingui()._;
    return (_jsxs(View, { style: [
            a.absolute,
            a.inset_0,
            { top: 'auto' },
            a.px_xl,
            a.py_lg,
            a.border_t,
            a.flex_row,
            a.align_center,
            a.flex_wrap,
            a.gap_xl,
            a.flex_1,
            t.atoms.border_contrast_medium,
        ], children: [_jsx(InlineLinkText, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Learn more about Bluesky"], ["Learn more about Bluesky"])))), to: "https://bsky.social", children: _jsx(Trans, { children: "Business" }) }), _jsx(InlineLinkText, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Read the Bluesky blog"], ["Read the Bluesky blog"])))), to: "https://bsky.social/about/blog", children: _jsx(Trans, { children: "Blog" }) }), _jsx(InlineLinkText, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["See jobs at Bluesky"], ["See jobs at Bluesky"])))), to: "https://bsky.social/about/join", children: _jsx(Trans, { comment: "Link to a page with job openings at Bluesky", children: "Jobs" }) }), _jsx(View, { style: a.flex_1 }), _jsx(AppLanguageDropdown, {})] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
