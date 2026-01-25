var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { StackActions, useFocusEffect, useNavigation, } from '@react-navigation/native';
import { usePalette } from '#/lib/hooks/usePalette';
import { s } from '#/lib/styles';
import { useSetMinimalShellMode } from '#/state/shell';
import { Button } from '#/view/com/util/forms/Button';
import { Text } from '#/view/com/util/text/Text';
import { ViewHeader } from '#/view/com/util/ViewHeader';
import * as Layout from '#/components/Layout';
export var NotFoundScreen = function () {
    var pal = usePalette('default');
    var _ = useLingui()._;
    var navigation = useNavigation();
    var setMinimalShellMode = useSetMinimalShellMode();
    useFocusEffect(React.useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    var canGoBack = navigation.canGoBack();
    var onPressHome = React.useCallback(function () {
        if (canGoBack) {
            navigation.goBack();
        }
        else {
            navigation.navigate('HomeTab');
            navigation.dispatch(StackActions.popToTop());
        }
    }, [navigation, canGoBack]);
    return (_jsxs(Layout.Screen, { testID: "notFoundView", children: [_jsx(ViewHeader, { title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Page Not Found"], ["Page Not Found"])))) }), _jsxs(View, { style: styles.container, children: [_jsx(Text, { type: "title-2xl", style: [pal.text, s.mb10], children: _jsx(Trans, { children: "Page not found" }) }), _jsx(Text, { type: "md", style: [pal.text, s.mb10], children: _jsx(Trans, { children: "We're sorry! We can't find the page you were looking for." }) }), _jsx(Button, { type: "primary", label: canGoBack ? _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Go Back"], ["Go Back"])))) : _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Go Home"], ["Go Home"])))), accessibilityLabel: canGoBack ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Go back"], ["Go back"])))) : _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Go home"], ["Go home"])))), accessibilityHint: canGoBack
                            ? _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Returns to previous page"], ["Returns to previous page"]))))
                            : _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Returns to home page"], ["Returns to home page"])))), onPress: onPressHome })] })] }));
};
var styles = StyleSheet.create({
    container: {
        paddingTop: 100,
        paddingHorizontal: 20,
        alignItems: 'center',
        height: '100%',
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
