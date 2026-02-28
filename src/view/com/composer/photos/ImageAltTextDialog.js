var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Plural, Trans } from '@lingui/react/macro';
import { MAX_ALT_TEXT } from '#/lib/constants';
import { useIsKeyboardVisible } from '#/lib/hooks/useIsKeyboardVisible';
import { enforceLen } from '#/lib/strings/helpers';
import { AltTextCounterWrapper } from '#/view/com/composer/AltTextCounterWrapper';
import { atoms as a, tokens, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/forms/TextField';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { Text } from '#/components/Typography';
import { IS_ANDROID, IS_LIQUID_GLASS, IS_WEB } from '#/env';
export var ImageAltTextDialog = function (_a) {
    var control = _a.control, image = _a.image, onChange = _a.onChange;
    var minHeight = useWindowDimensions().height;
    var _b = useState(image.alt), altText = _b[0], setAltText = _b[1];
    return (_jsxs(Dialog.Outer, { control: control, onClose: function () {
            onChange(__assign(__assign({}, image), { alt: enforceLen(altText, MAX_ALT_TEXT, true) }));
        }, nativeOptions: { minHeight: minHeight }, children: [_jsx(Dialog.Handle, {}), _jsx(ImageAltTextInner, { control: control, image: image, altText: altText, setAltText: setAltText })] }));
};
var ImageAltTextInner = function (_a) {
    var _b;
    var altText = _a.altText, setAltText = _a.setAltText, control = _a.control, image = _a.image;
    var _c = useLingui(), _ = _c._, i18n = _c.i18n;
    var t = useTheme();
    var screenWidth = useWindowDimensions().width;
    var isKeyboardVisible = useIsKeyboardVisible()[0];
    var imageStyle = useMemo(function () {
        var _a;
        var maxWidth = IS_WEB
            ? 450
            : screenWidth - // account for dialog padding
                2 * (IS_LIQUID_GLASS ? tokens.space._2xl : tokens.space.xl);
        var source = (_a = image.transformed) !== null && _a !== void 0 ? _a : image.source;
        if (source.height > source.width) {
            return {
                resizeMode: 'contain',
                width: '100%',
                aspectRatio: 1,
                borderRadius: 8,
            };
        }
        return {
            width: '100%',
            height: (maxWidth / source.width) * source.height,
            borderRadius: 8,
        };
    }, [image, screenWidth]);
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Add alt text"], ["Add alt text"])))), children: [_jsx(Dialog.Close, {}), _jsxs(View, { children: [IS_WEB && (_jsx(Text, { style: [a.text_2xl, a.font_semi_bold, a.leading_tight, a.pb_sm], children: _jsx(Trans, { children: "Add alt text" }) })), _jsx(View, { style: [t.atoms.bg_contrast_50, a.rounded_sm, a.overflow_hidden], children: _jsx(Image, { style: imageStyle, source: { uri: ((_b = image.transformed) !== null && _b !== void 0 ? _b : image.source).path }, contentFit: "contain", accessible: true, accessibilityIgnoresInvertColors: true, enableLiveTextInteraction: true, autoplay: false }) })] }), _jsxs(View, { style: [a.mt_md, a.gap_md], children: [_jsxs(View, { style: [a.gap_sm], children: [_jsxs(View, { style: [a.relative, { width: '100%' }], children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Descriptive alt text" }) }), _jsx(TextField.Root, { children: _jsx(Dialog.Input, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Alt text"], ["Alt text"])))), onChangeText: function (text) {
                                                setAltText(text);
                                            }, defaultValue: altText, multiline: true, numberOfLines: 3, autoFocus: true }) })] }), altText.length > MAX_ALT_TEXT && (_jsxs(View, { style: [a.pb_sm, a.flex_row, a.gap_xs], children: [_jsx(CircleInfo, { fill: t.palette.negative_500 }), _jsx(Text, { style: [
                                            a.italic,
                                            a.leading_snug,
                                            t.atoms.text_contrast_medium,
                                        ], children: _jsxs(Trans, { children: ["Alt text will be truncated.", ' ', _jsx(Plural, { value: MAX_ALT_TEXT, other: "Limit: ".concat(i18n.number(MAX_ALT_TEXT), " characters.") })] }) })] }))] }), _jsx(AltTextCounterWrapper, { altText: altText, children: _jsx(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Save"], ["Save"])))), disabled: altText === image.alt, size: "large", color: "primary", variant: "solid", onPress: function () {
                                control.close();
                            }, style: [a.flex_grow], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Save" }) }) }) })] }), IS_ANDROID && isKeyboardVisible ? _jsx(View, { style: { height: 300 } }) : null] }));
};
var templateObject_1, templateObject_2, templateObject_3;
