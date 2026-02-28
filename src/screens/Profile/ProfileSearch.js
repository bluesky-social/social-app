var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';
import { SearchScreenShell } from '#/screens/Search/Shell';
export var ProfileSearchScreen = function (_a) {
    var route = _a.route;
    var _b = route.params, name = _b.name, _c = _b.q, queryParam = _c === void 0 ? '' : _c;
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var resolvedDid = useResolveDidQuery(name).data;
    var profile = useProfileQuery({ did: resolvedDid }).data;
    var fixedParams = useMemo(function () {
        var _a;
        return ({
            from: (_a = profile === null || profile === void 0 ? void 0 : profile.handle) !== null && _a !== void 0 ? _a : name,
        });
    }, [profile === null || profile === void 0 ? void 0 : profile.handle, name]);
    return (_jsx(SearchScreenShell, { navButton: "back", inputPlaceholder: profile
            ? (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === profile.did
                ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Search my posts"], ["Search my posts"]))))
                : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Search @", "'s posts"], ["Search @", "'s posts"])), profile.handle))
            : _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Search..."], ["Search..."])))), fixedParams: fixedParams, queryParam: queryParam, testID: "searchPostsScreen" }));
};
var templateObject_1, templateObject_2, templateObject_3;
