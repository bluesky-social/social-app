var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export function getRootNavigation(nav) {
    while (nav.getParent()) {
        nav = nav.getParent();
    }
    return nav;
}
export function getCurrentRoute(state) {
    var _a, _b, _c, _d;
    if (!state) {
        return { name: 'Home' };
    }
    var node = state.routes[state.index || 0];
    while (((_a = node.state) === null || _a === void 0 ? void 0 : _a.routes) && typeof ((_b = node.state) === null || _b === void 0 ? void 0 : _b.index) === 'number') {
        node = (_c = node.state) === null || _c === void 0 ? void 0 : _c.routes[(_d = node.state) === null || _d === void 0 ? void 0 : _d.index];
    }
    return node;
}
export function isStateAtTabRoot(state) {
    if (!state) {
        // NOTE
        // if state is not defined it's because init is occurring
        // and therefore we can safely assume we're at root
        // -prf
        return true;
    }
    var currentRoute = getCurrentRoute(state);
    return (isTab(currentRoute.name, 'Home') ||
        isTab(currentRoute.name, 'Search') ||
        isTab(currentRoute.name, 'Messages') ||
        isTab(currentRoute.name, 'Notifications') ||
        isTab(currentRoute.name, 'MyProfile'));
}
export function isTab(current, route) {
    // NOTE
    // our tab routes can be variously referenced by 3 different names
    // this helper deals with that weirdness
    // -prf
    return (current === route ||
        current === "".concat(route, "Tab") ||
        current === "".concat(route, "Inner"));
}
export var TabState;
(function (TabState) {
    TabState[TabState["InsideAtRoot"] = 0] = "InsideAtRoot";
    TabState[TabState["Inside"] = 1] = "Inside";
    TabState[TabState["Outside"] = 2] = "Outside";
})(TabState || (TabState = {}));
export function getTabState(state, tab) {
    if (!state) {
        return TabState.Outside;
    }
    var currentRoute = getCurrentRoute(state);
    if (isTab(currentRoute.name, tab)) {
        return TabState.InsideAtRoot;
    }
    else if (isTab(state.routes[state.index || 0].name, tab)) {
        return TabState.Inside;
    }
    return TabState.Outside;
}
export function buildStateObject(stack, route, params, state) {
    if (state === void 0) { state = []; }
    if (stack === 'Flat') {
        return {
            routes: [{ name: route, params: params }],
        };
    }
    return {
        routes: [
            {
                name: stack,
                state: {
                    routes: __spreadArray(__spreadArray([], state, true), [{ name: route, params: params }], false),
                },
            },
        ],
    };
}
