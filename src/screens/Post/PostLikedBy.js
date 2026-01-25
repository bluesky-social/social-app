import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Plural, Trans } from '@lingui/macro';
import { useFocusEffect } from '@react-navigation/native';
import { makeRecordUri } from '#/lib/strings/url-helpers';
import { usePostQuery } from '#/state/queries/post';
import { useSetMinimalShellMode } from '#/state/shell';
import { PostLikedBy as PostLikedByComponent } from '#/view/com/post-thread/PostLikedBy';
import * as Layout from '#/components/Layout';
export var PostLikedByScreen = function (_a) {
    var route = _a.route;
    var setMinimalShellMode = useSetMinimalShellMode();
    var _b = route.params, name = _b.name, rkey = _b.rkey;
    var uri = makeRecordUri(name, 'app.bsky.feed.post', rkey);
    var post = usePostQuery(uri).data;
    var likeCount;
    if (post) {
        likeCount = post.likeCount;
    }
    useFocusEffect(React.useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: post && (_jsxs(_Fragment, { children: [_jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Liked By" }) }), _jsx(Layout.Header.SubtitleText, { children: _jsx(Plural, { value: likeCount !== null && likeCount !== void 0 ? likeCount : 0, one: "# like", other: "# likes" }) })] })) }), _jsx(Layout.Header.Slot, {})] }), _jsx(PostLikedByComponent, { uri: uri })] }));
};
