import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { Trans } from '@lingui/react/macro';
import { useFocusEffect } from '@react-navigation/native';
import { makeRecordUri } from '#/lib/strings/url-helpers';
import { useSetMinimalShellMode } from '#/state/shell';
import { PostLikedBy as PostLikedByComponent } from '#/view/com/post-thread/PostLikedBy';
import * as Layout from '#/components/Layout';
export var ProfileFeedLikedByScreen = function (_a) {
    var route = _a.route;
    var setMinimalShellMode = useSetMinimalShellMode();
    var _b = route.params, name = _b.name, rkey = _b.rkey;
    var uri = makeRecordUri(name, 'app.bsky.feed.generator', rkey);
    useFocusEffect(useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    return (_jsxs(Layout.Screen, { testID: "postLikedByScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Liked By" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(PostLikedByComponent, { uri: uri })] }));
};
