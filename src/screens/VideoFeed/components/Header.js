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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { HITSLOP_30 } from '#/lib/constants';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useFeedSourceInfoQuery } from '#/state/queries/feed';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useBreakpoints } from '#/alf';
import { Button } from '#/components/Button';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft } from '#/components/icons/Arrow';
import * as Layout from '#/components/Layout';
import { BUTTON_VISUAL_ALIGNMENT_OFFSET } from '#/components/Layout/const';
import { Text } from '#/components/Typography';
export function HeaderPlaceholder() {
    return (_jsxs(View, { style: [a.flex_1, a.flex_row, a.align_center, a.gap_sm], children: [_jsx(View, { style: [
                    a.rounded_sm,
                    {
                        width: 36,
                        height: 36,
                        backgroundColor: 'white',
                        opacity: 0.8,
                    },
                ] }), _jsxs(View, { style: [a.flex_1, a.gap_xs], children: [_jsx(View, { style: [
                            a.w_full,
                            a.rounded_xs,
                            {
                                backgroundColor: 'white',
                                height: 14,
                                width: 80,
                                opacity: 0.8,
                            },
                        ] }), _jsx(View, { style: [
                            a.w_full,
                            a.rounded_xs,
                            {
                                backgroundColor: 'white',
                                height: 10,
                                width: 140,
                                opacity: 0.6,
                            },
                        ] })] })] }));
}
export function Header(_a) {
    var sourceContext = _a.sourceContext;
    var content = null;
    switch (sourceContext.type) {
        case 'feedgen': {
            content = _jsx(FeedHeader, { sourceContext: sourceContext });
            break;
        }
        case 'author':
        // TODO
        default: {
            break;
        }
    }
    return (_jsxs(Layout.Header.Outer, { noBottomBorder: true, children: [_jsx(BackButton, {}), _jsx(Layout.Header.Content, { align: "left", children: content })] }));
}
export function FeedHeader(_a) {
    var sourceContext = _a.sourceContext;
    var gtMobile = useBreakpoints().gtMobile;
    var _b = useFeedSourceInfoQuery({ uri: sourceContext.uri }), info = _b.data, isLoading = _b.isLoading, error = _b.error;
    if (sourceContext.sourceInterstitial !== undefined) {
        // For now, don't show the header if coming from an interstitial.
        return null;
    }
    if (isLoading) {
        return _jsx(HeaderPlaceholder, {});
    }
    else if (error || !info) {
        return null;
    }
    return (_jsxs(View, { style: [a.flex_1, a.flex_row, a.align_center, a.gap_sm], children: [info.avatar && _jsx(UserAvatar, { size: 36, type: "algo", avatar: info.avatar }), _jsxs(View, { style: [a.flex_1], children: [_jsx(Text, { style: [
                            a.text_md,
                            a.font_bold,
                            a.leading_tight,
                            gtMobile && a.text_lg,
                        ], numberOfLines: 2, children: info.displayName }), _jsx(View, { style: [a.flex_row, { gap: 6 }], children: _jsx(Text, { style: [a.flex_shrink, a.text_sm, a.leading_snug], numberOfLines: 1, children: sanitizeHandle(info.creatorHandle, '@') }) })] })] }));
}
// TODO: This customization should be a part of the layout component
export function BackButton(_a) {
    var onPress = _a.onPress, style = _a.style, props = __rest(_a, ["onPress", "style"]);
    var _ = useLingui()._;
    var navigation = useNavigation();
    var onPressBack = useCallback(function (evt) {
        onPress === null || onPress === void 0 ? void 0 : onPress(evt);
        if (evt.defaultPrevented)
            return;
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
        else {
            navigation.navigate('Home');
        }
    }, [onPress, navigation]);
    return (_jsx(Layout.Header.Slot, { children: _jsx(Button, __assign({ label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Go back"], ["Go back"])))), size: "small", variant: "ghost", color: "secondary", shape: "round", onPress: onPressBack, hitSlop: HITSLOP_30, style: [
                { marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET },
                a.bg_transparent,
                style,
            ] }, props, { children: _jsx(ArrowLeft, { size: "lg", fill: "white" }) })) }));
}
var templateObject_1;
