var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useFocusEffect } from '@react-navigation/native';
import { HELP_DESK_URL } from '#/lib/constants';
import { usePalette } from '#/lib/hooks/usePalette';
import { s } from '#/lib/styles';
import { useSetMinimalShellMode } from '#/state/shell';
import { TextLink } from '#/view/com/util/Link';
import { Text } from '#/view/com/util/text/Text';
import { ViewHeader } from '#/view/com/util/ViewHeader';
import { CenteredView } from '#/view/com/util/Views';
import * as Layout from '#/components/Layout';
export var SupportScreen = function (_props) {
    var pal = usePalette('default');
    var setMinimalShellMode = useSetMinimalShellMode();
    var _ = useLingui()._;
    useFocusEffect(React.useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    return (_jsxs(Layout.Screen, { children: [_jsx(ViewHeader, { title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Support"], ["Support"])))) }), _jsxs(CenteredView, { children: [_jsx(Text, { type: "title-xl", style: [pal.text, s.p20, s.pb5], children: _jsx(Trans, { children: "Support" }) }), _jsx(Text, { style: [pal.text, s.p20], children: _jsxs(Trans, { children: ["The support form has been moved. If you need help, please", ' ', _jsx(TextLink, { href: HELP_DESK_URL, text: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["click here"], ["click here"])))), style: pal.link }), ' ', "or visit ", HELP_DESK_URL, " to get in touch with us."] }) })] })] }));
};
var templateObject_1, templateObject_2;
