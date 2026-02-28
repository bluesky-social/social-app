var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Image as RNImage, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useHaptics } from '#/lib/haptics';
import { Logo } from '#/view/icons/Logo';
import { Logotype } from '#/view/icons/Logotype';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
// @ts-ignore
import splashImagePointer from '../../../../assets/splash/illustration-mobile.png';
// @ts-ignore
import darkSplashImagePointer from '../../../../assets/splash/illustration-mobile-dark.png';
var splashImageUri = RNImage.resolveAssetSource(splashImagePointer).uri;
var darkSplashImageUri = RNImage.resolveAssetSource(darkSplashImagePointer).uri;
export var SplashScreen = function (_a) {
    var onPressSignin = _a.onPressSignin, onPressCreateAccount = _a.onPressCreateAccount;
    var t = useTheme();
    var _ = useLingui()._;
    var isDarkMode = t.name !== 'light';
    var playHaptic = useHaptics();
    var styles = useMemo(function () {
        var logoFill = isDarkMode ? 'white' : t.palette.primary_500;
        return {
            logoFill: logoFill,
            logoShadow: isDarkMode
                ? [
                    t.atoms.shadow_md,
                    {
                        shadowColor: logoFill,
                        shadowOpacity: 0.5,
                        shadowOffset: {
                            width: 0,
                            height: 0,
                        },
                    },
                ]
                : [],
        };
    }, [t, isDarkMode]);
    return (_jsxs(_Fragment, { children: [_jsx(Image, { accessibilityIgnoresInvertColors: true, source: { uri: isDarkMode ? darkSplashImageUri : splashImageUri }, style: [a.absolute, a.inset_0] }), _jsxs(Animated.View, { entering: FadeIn.duration(90), exiting: FadeOut.duration(90), style: [a.flex_1], children: [_jsxs(View, { style: [a.justify_center, a.align_center, { gap: 6, paddingTop: 46 }], children: [_jsx(Logo, { width: 76, fill: styles.logoFill, style: styles.logoShadow }), _jsx(Logotype, { width: 91, fill: styles.logoFill, style: styles.logoShadow })] }), _jsx(View, { style: [a.flex_1] }), _jsxs(View, { testID: "signinOrCreateAccount", style: [a.px_5xl, a.gap_md, a.pb_sm], children: [_jsx(View, { style: [
                                    t.atoms.shadow_md,
                                    {
                                        shadowOpacity: 0.1,
                                        shadowOffset: {
                                            width: 0,
                                            height: 5,
                                        },
                                    },
                                ], children: _jsx(Button, { testID: "createAccountButton", onPress: function () {
                                        onPressCreateAccount();
                                        playHaptic('Light');
                                    }, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Create new account"], ["Create new account"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Opens flow to create a new Bluesky account"], ["Opens flow to create a new Bluesky account"])))), size: "large", color: isDarkMode ? 'secondary_inverted' : 'secondary', children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Create account" }) }) }) }), _jsx(Button, { testID: "signInButton", onPress: function () {
                                    onPressSignin();
                                    playHaptic('Light');
                                }, label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Sign in"], ["Sign in"])))), accessibilityHint: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Opens flow to sign in to your existing Bluesky account"], ["Opens flow to sign in to your existing Bluesky account"])))), size: "large", children: _jsx(ButtonText, { style: { color: 'white' }, children: _jsx(Trans, { children: "Sign in" }) }) })] })] })] }));
};
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
