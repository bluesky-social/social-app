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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useImperativeHandle, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { BSKY_SERVICE } from '#/lib/constants';
import * as persisted from '#/state/persisted';
import { useSession } from '#/state/session';
import { atoms as a, platform, useBreakpoints, useTheme, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as SegmentedControl from '#/components/forms/SegmentedControl';
import * as TextField from '#/components/forms/TextField';
import { Globe_Stroke2_Corner0_Rounded as Globe } from '#/components/icons/Globe';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
export function ServerInputDialog(_a) {
    var control = _a.control, onSelect = _a.onSelect;
    var ax = useAnalytics();
    var height = useWindowDimensions().height;
    var formRef = useRef(null);
    // persist these options between dialog open/close
    var _b = useState(BSKY_SERVICE), fixedOption = _b[0], setFixedOption = _b[1];
    var _c = useState(''), previousCustomAddress = _c[0], setPreviousCustomAddress = _c[1];
    var onClose = useCallback(function () {
        var _a;
        var result = (_a = formRef.current) === null || _a === void 0 ? void 0 : _a.getFormState();
        if (result) {
            onSelect(result);
            if (result !== BSKY_SERVICE) {
                setPreviousCustomAddress(result);
            }
        }
        ax.metric('signin:hostingProviderPressed', {
            hostingProviderDidChange: fixedOption !== BSKY_SERVICE,
        });
    }, [ax, onSelect, fixedOption]);
    return (_jsxs(Dialog.Outer, { control: control, onClose: onClose, nativeOptions: platform({
            android: { minHeight: height / 2 },
            ios: { preventExpansion: true },
        }), children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, { formRef: formRef, fixedOption: fixedOption, setFixedOption: setFixedOption, initialCustomAddress: previousCustomAddress })] }));
}
function DialogInner(_a) {
    var formRef = _a.formRef, fixedOption = _a.fixedOption, setFixedOption = _a.setFixedOption, initialCustomAddress = _a.initialCustomAddress;
    var control = Dialog.useDialogContext();
    var _ = useLingui()._;
    var t = useTheme();
    var accounts = useSession().accounts;
    var gtMobile = useBreakpoints().gtMobile;
    var _b = useState(initialCustomAddress), customAddress = _b[0], setCustomAddress = _b[1];
    var _c = useState(persisted.get('pdsAddressHistory') || []), pdsAddressHistory = _c[0], setPdsAddressHistory = _c[1];
    useImperativeHandle(formRef, function () { return ({
        getFormState: function () {
            var url;
            if (fixedOption === 'custom') {
                url = customAddress.trim().toLowerCase();
                if (!url) {
                    return null;
                }
            }
            else {
                url = fixedOption;
            }
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                if (url === 'localhost' || url.startsWith('localhost:')) {
                    url = "http://".concat(url);
                }
                else {
                    url = "https://".concat(url);
                }
            }
            if (fixedOption === 'custom') {
                if (!pdsAddressHistory.includes(url)) {
                    var newHistory = __spreadArray([url], pdsAddressHistory.slice(0, 4), true);
                    setPdsAddressHistory(newHistory);
                    persisted.write('pdsAddressHistory', newHistory);
                }
            }
            return url;
        },
    }); }, [customAddress, fixedOption, pdsAddressHistory]);
    var isFirstTimeUser = accounts.length === 0;
    return (_jsx(Dialog.ScrollableInner, { accessibilityDescribedBy: "dialog-description", accessibilityLabelledBy: "dialog-title", style: web({ maxWidth: 500 }), children: _jsxs(View, { style: [a.relative, a.gap_md, a.w_full], children: [_jsx(Text, { nativeID: "dialog-title", style: [a.text_2xl, a.font_bold], children: _jsx(Trans, { children: "Choose your account provider" }) }), _jsxs(SegmentedControl.Root, { type: "tabs", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Account provider"], ["Account provider"])))), value: fixedOption, onChange: setFixedOption, children: [_jsx(SegmentedControl.Item, { testID: "bskyServiceSelectBtn", value: BSKY_SERVICE, label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Bluesky"], ["Bluesky"])))), children: _jsx(SegmentedControl.ItemText, { children: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Bluesky"], ["Bluesky"])))) }) }), _jsx(SegmentedControl.Item, { testID: "customSelectBtn", value: "custom", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Custom"], ["Custom"])))), children: _jsx(SegmentedControl.ItemText, { children: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Custom"], ["Custom"])))) }) })] }), fixedOption === BSKY_SERVICE && isFirstTimeUser && (_jsx(View, { role: "tabpanel", children: _jsx(Admonition, { type: "tip", children: _jsx(Trans, { children: "Bluesky is an open network where you can choose your own provider. If you're new here, we recommend sticking with the default Bluesky Social option." }) }) })), fixedOption === 'custom' && (_jsxs(View, { role: "tabpanel", children: [_jsx(TextField.LabelText, { nativeID: "address-input-label", children: _jsx(Trans, { children: "Server address" }) }), _jsxs(TextField.Root, { children: [_jsx(TextField.Icon, { icon: Globe }), _jsx(Dialog.Input, { testID: "customServerTextInput", value: customAddress, onChangeText: setCustomAddress, label: "my-server.com", accessibilityLabelledBy: "address-input-label", autoCapitalize: "none", keyboardType: "url" })] }), pdsAddressHistory.length > 0 && (_jsx(View, { style: [a.flex_row, a.flex_wrap, a.mt_xs], children: pdsAddressHistory.map(function (uri) { return (_jsx(Button, { variant: "ghost", color: "primary", label: uri, style: [a.px_sm, a.py_xs, a.rounded_sm, a.gap_sm], onPress: function () { return setCustomAddress(uri); }, children: _jsx(ButtonText, { children: uri }) }, uri)); }) }))] })), _jsx(View, { style: [a.py_xs], children: _jsxs(Text, { style: [t.atoms.text_contrast_medium, a.text_sm, a.leading_snug], children: [isFirstTimeUser ? (_jsx(Trans, { children: "If you're a developer, you can host your own server." })) : (_jsx(Trans, { children: "Bluesky is an open network where you can choose your hosting provider. If you're a developer, you can host your own server." })), ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Learn more about self hosting your PDS."], ["Learn more about self hosting your PDS."])))), to: "https://atproto.com/guides/self-hosting", children: _jsx(Trans, { children: "Learn more." }) })] }) }), _jsx(View, { style: gtMobile && [a.flex_row, a.justify_end], children: _jsx(Button, { testID: "doneBtn", variant: "solid", color: "primary", size: platform({
                            native: 'large',
                            web: 'small',
                        }), onPress: function () { return control.close(); }, label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Done"], ["Done"])))), children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Done" }) }) }) })] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
