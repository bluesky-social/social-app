var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useHaptics } from '#/lib/haptics';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';
import { CenteredView } from '#/view/com/util/Views';
import { Logo } from '#/view/icons/Logo';
import { Logotype } from '#/view/icons/Logotype';
import { atoms as a, useTheme } from '#/alf';
import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { Button, ButtonText } from '#/components/Button';
import { Text } from '#/components/Typography';
export var SplashScreen = function (_a) {
    var onPressSignin = _a.onPressSignin, onPressCreateAccount = _a.onPressCreateAccount;
    var t = useTheme();
    var _ = useLingui()._;
    var playHaptic = useHaptics();
    var insets = useSafeAreaInsets();
    return (_jsx(CenteredView, { style: [a.h_full, a.flex_1], children: _jsx(Animated.View, { entering: FadeIn.duration(90), exiting: FadeOut.duration(90), style: [a.flex_1], children: _jsxs(ErrorBoundary, { children: [_jsxs(View, { style: [a.flex_1, a.justify_center, a.align_center], children: [_jsx(Logo, { width: 92, fill: "sky" }), _jsx(View, { style: [a.pb_sm, a.pt_5xl], children: _jsx(Logotype, { width: 161, fill: t.atoms.text.color }) }), _jsx(Text, { style: [
                                    a.text_md,
                                    a.font_semi_bold,
                                    t.atoms.text_contrast_medium,
                                    a.text_center,
                                ], children: _jsx(Trans, { children: "What's up?" }) })] }), _jsxs(View, { testID: "signinOrCreateAccount", style: [a.px_xl, a.gap_md, a.pb_2xl], children: [_jsx(Button, { testID: "createAccountButton", onPress: function () {
                                    onPressCreateAccount();
                                    playHaptic('Light');
                                }, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Create new account"], ["Create new account"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Opens flow to create a new Bluesky account"], ["Opens flow to create a new Bluesky account"])))), size: "large", variant: "solid", color: "primary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Create account" }) }) }), _jsx(Button, { testID: "signInButton", onPress: function () {
                                    onPressSignin();
                                    playHaptic('Light');
                                }, label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Sign in"], ["Sign in"])))), accessibilityHint: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Opens flow to sign in to your existing Bluesky account"], ["Opens flow to sign in to your existing Bluesky account"])))), size: "large", variant: "solid", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Sign in" }) }) })] }), _jsx(View, { style: [
                            a.px_lg,
                            a.pt_md,
                            a.pb_2xl,
                            a.justify_center,
                            a.align_center,
                        ], children: _jsx(View, { children: _jsx(AppLanguageDropdown, {}) }) }), _jsx(View, { style: { height: insets.bottom } })] }) }) }));
};
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
