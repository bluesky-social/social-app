var Router = /** @class */ (function () {
    function Router(description) {
        var _this = this;
        this.routes = [];
        var _loop_1 = function (screen_1, pattern) {
            if (typeof pattern === 'string') {
                this_1.routes.push([screen_1, createRoute(pattern)]);
            }
            else {
                pattern.forEach(function (subPattern) {
                    _this.routes.push([screen_1, createRoute(subPattern)]);
                });
            }
        };
        var this_1 = this;
        for (var _i = 0, _a = Object.entries(description); _i < _a.length; _i++) {
            var _b = _a[_i], screen_1 = _b[0], pattern = _b[1];
            _loop_1(screen_1, pattern);
        }
    }
    Router.prototype.matchName = function (name) {
        for (var _i = 0, _a = this.routes; _i < _a.length; _i++) {
            var _b = _a[_i], screenName = _b[0], route = _b[1];
            if (screenName === name) {
                return route;
            }
        }
    };
    Router.prototype.matchPath = function (path) {
        var name = 'NotFound';
        var params = {};
        for (var _i = 0, _a = this.routes; _i < _a.length; _i++) {
            var _b = _a[_i], screenName = _b[0], route = _b[1];
            var res = route.match(path);
            if (res) {
                name = screenName;
                params = res.params;
                break;
            }
        }
        return [name, params];
    };
    return Router;
}());
export { Router };
function createRoute(pattern) {
    var pathParamNames = new Set();
    var matcherReInternal = pattern.replace(/:([\w]+)/g, function (_m, name) {
        pathParamNames.add(name);
        return "(?<".concat(name, ">[^/]+)");
    });
    var matcherRe = new RegExp("^".concat(matcherReInternal, "([?]|$)"), 'i');
    return {
        match: function (path) {
            var _a = new URL(path, 'http://throwaway.com'), pathname = _a.pathname, searchParams = _a.searchParams;
            var addedParams = Object.fromEntries(searchParams.entries());
            var res = matcherRe.exec(pathname);
            if (res) {
                return { params: Object.assign(addedParams, res.groups || {}) };
            }
            return undefined;
        },
        build: function (params) {
            if (params === void 0) { params = {}; }
            var str = pattern.replace(/:([\w]+)/g, function (_m, name) { return params[encodeURIComponent(name)] || 'undefined'; });
            var hasQp = false;
            var qp = new URLSearchParams();
            for (var paramName in params) {
                if (!pathParamNames.has(paramName)) {
                    qp.set(paramName, params[paramName]);
                    hasQp = true;
                }
            }
            return str + (hasQp ? "?".concat(qp.toString()) : '');
        },
    };
}
