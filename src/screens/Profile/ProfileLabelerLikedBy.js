var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useFocusEffect } from '@react-navigation/native';
import { makeRecordUri } from '#/lib/strings/url-helpers';
import { useSetMinimalShellMode } from '#/state/shell';
import { ViewHeader } from '#/view/com/util/ViewHeader';
import * as Layout from '#/components/Layout';
import { LikedByList } from '#/components/LikedByList';
export function ProfileLabelerLikedByScreen(_a) {
    var route = _a.route;
    var setMinimalShellMode = useSetMinimalShellMode();
    var handleOrDid = route.params.name;
    var uri = makeRecordUri(handleOrDid, 'app.bsky.labeler.service', 'self');
    var _ = useLingui()._;
    useFocusEffect(React.useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    return (_jsxs(Layout.Screen, { children: [_jsx(ViewHeader, { title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Liked By"], ["Liked By"])))) }), _jsx(LikedByList, { uri: uri })] }));
}
var templateObject_1;
