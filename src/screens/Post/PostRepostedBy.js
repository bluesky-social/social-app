import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Plural, Trans } from '@lingui/macro';
import { useFocusEffect } from '@react-navigation/native';
import { makeRecordUri } from '#/lib/strings/url-helpers';
import { usePostQuery } from '#/state/queries/post';
import { useSetMinimalShellMode } from '#/state/shell';
import { PostRepostedBy as PostRepostedByComponent } from '#/view/com/post-thread/PostRepostedBy';
import * as Layout from '#/components/Layout';
export var PostRepostedByScreen = function (_a) {
    var route = _a.route;
    var _b = route.params, name = _b.name, rkey = _b.rkey;
    var uri = makeRecordUri(name, 'app.bsky.feed.post', rkey);
    var setMinimalShellMode = useSetMinimalShellMode();
    var post = usePostQuery(uri).data;
    var quoteCount;
    if (post) {
        quoteCount = post.repostCount;
    }
    useFocusEffect(React.useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: post && (_jsxs(_Fragment, { children: [_jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Reposted By" }) }), _jsx(Layout.Header.SubtitleText, { children: _jsx(Plural, { value: quoteCount !== null && quoteCount !== void 0 ? quoteCount : 0, one: "# repost", other: "# reposts" }) })] })) }), _jsx(Layout.Header.Slot, {})] }), _jsx(PostRepostedByComponent, { uri: uri })] }));
};
