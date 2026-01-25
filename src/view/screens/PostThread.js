import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { makeRecordUri } from '#/lib/strings/url-helpers';
import { useSetMinimalShellMode } from '#/state/shell';
import { PostThread } from '#/screens/PostThread';
import * as Layout from '#/components/Layout';
export function PostThreadScreen(_a) {
    var route = _a.route;
    var setMinimalShellMode = useSetMinimalShellMode();
    var _b = route.params, name = _b.name, rkey = _b.rkey;
    var uri = makeRecordUri(name, 'app.bsky.feed.post', rkey);
    useFocusEffect(useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    return (_jsx(Layout.Screen, { testID: "postThreadScreen", children: _jsx(PostThread, { uri: uri }) }));
}
