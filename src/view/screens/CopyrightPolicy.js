var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useFocusEffect } from '@react-navigation/native';
import { usePalette } from '#/lib/hooks/usePalette';
import { s } from '#/lib/styles';
import { useSetMinimalShellMode } from '#/state/shell';
import { TextLink } from '#/view/com/util/Link';
import { Text } from '#/view/com/util/text/Text';
import { ScrollView } from '#/view/com/util/Views';
import * as Layout from '#/components/Layout';
import { ViewHeader } from '../com/util/ViewHeader';
export var CopyrightPolicyScreen = function (_props) {
    var pal = usePalette('default');
    var _ = useLingui()._;
    var setMinimalShellMode = useSetMinimalShellMode();
    useFocusEffect(React.useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    return (_jsxs(Layout.Screen, { children: [_jsx(ViewHeader, { title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Copyright Policy"], ["Copyright Policy"])))) }), _jsxs(ScrollView, { style: [s.hContentRegion, pal.view], children: [_jsx(View, { style: [s.p20], children: _jsx(Text, { style: pal.text, children: _jsxs(Trans, { children: ["The Copyright Policy has been moved to", ' ', _jsx(TextLink, { style: pal.link, href: "https://bsky.social/about/support/copyright", text: "bsky.social/about/support/copyright" })] }) }) }), _jsx(View, { style: s.footerSpacer })] })] }));
};
var templateObject_1;
