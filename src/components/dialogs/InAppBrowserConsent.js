var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useOpenLink } from '#/lib/hooks/useOpenLink';
import { useSetInAppBrowser } from '#/state/preferences/in-app-browser';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { SquareArrowTopRight_Stroke2_Corner0_Rounded as External } from '#/components/icons/SquareArrowTopRight';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
import { useGlobalDialogsControlContext } from './Context';
export function InAppBrowserConsentDialog() {
    var inAppBrowserConsentControl = useGlobalDialogsControlContext().inAppBrowserConsentControl;
    if (IS_WEB)
        return null;
    return (_jsxs(Dialog.Outer, { control: inAppBrowserConsentControl.control, nativeOptions: { preventExpansion: true }, onClose: inAppBrowserConsentControl.clear, children: [_jsx(Dialog.Handle, {}), _jsx(InAppBrowserConsentInner, { href: inAppBrowserConsentControl.value })] }));
}
function InAppBrowserConsentInner(_a) {
    var href = _a.href;
    var control = Dialog.useDialogContext();
    var _ = useLingui()._;
    var t = useTheme();
    var setInAppBrowser = useSetInAppBrowser();
    var openLink = useOpenLink();
    var onUseIAB = useCallback(function () {
        control.close(function () {
            setInAppBrowser(true);
            if (href) {
                openLink(href, true);
            }
        });
    }, [control, setInAppBrowser, href, openLink]);
    var onUseLinking = useCallback(function () {
        control.close(function () {
            setInAppBrowser(false);
            if (href) {
                openLink(href, false);
            }
        });
    }, [control, setInAppBrowser, href, openLink]);
    var onCancel = useCallback(function () {
        control.close();
    }, [control]);
    return (_jsx(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["How should we open this link?"], ["How should we open this link?"])))), children: _jsxs(View, { style: [a.gap_2xl], children: [_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.font_bold, a.text_2xl], children: _jsx(Trans, { children: "How should we open this link?" }) }), _jsx(Text, { style: [t.atoms.text_contrast_high, a.leading_snug, a.text_md], children: _jsx(Trans, { children: "Your choice will be remembered for future links. You can change it at any time in settings." }) })] }), _jsxs(View, { style: [a.gap_sm], children: [_jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Use in-app browser"], ["Use in-app browser"])))), onPress: onUseIAB, size: "large", variant: "solid", color: "primary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Use in-app browser" }) }) }), _jsxs(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Use my default browser"], ["Use my default browser"])))), onPress: onUseLinking, size: "large", variant: "solid", color: "secondary", children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Use my default browser" }) }), _jsx(ButtonIcon, { position: "right", icon: External })] }), _jsx(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Cancel"], ["Cancel"])))), onPress: onCancel, size: "large", variant: "ghost", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) })] })] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
