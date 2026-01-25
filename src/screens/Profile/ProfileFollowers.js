import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Plural } from '@lingui/macro';
import { useFocusEffect } from '@react-navigation/native';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSetMinimalShellMode } from '#/state/shell';
import { ProfileFollowers as ProfileFollowersComponent } from '#/view/com/profile/ProfileFollowers';
import * as Layout from '#/components/Layout';
export var ProfileFollowersScreen = function (_a) {
    var _b;
    var route = _a.route;
    var name = route.params.name;
    var setMinimalShellMode = useSetMinimalShellMode();
    var resolvedDid = useResolveDidQuery(name).data;
    var profile = useProfileQuery({
        did: resolvedDid,
    }).data;
    useFocusEffect(React.useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    return (_jsxs(Layout.Screen, { testID: "profileFollowersScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: profile && (_jsxs(_Fragment, { children: [_jsx(Layout.Header.TitleText, { children: sanitizeDisplayName(profile.displayName || profile.handle) }), _jsx(Layout.Header.SubtitleText, { children: _jsx(Plural, { value: (_b = profile.followersCount) !== null && _b !== void 0 ? _b : 0, one: "# follower", other: "# followers" }) })] })) }), _jsx(Layout.Header.Slot, {})] }), _jsx(ProfileFollowersComponent, { name: name })] }));
};
