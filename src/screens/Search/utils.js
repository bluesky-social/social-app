export function parseSearchQuery(rawQuery) {
    var base = rawQuery;
    var rawLiterals = rawQuery.match(/[^:\w\d]".+?"/gi) || [];
    // remove literals from base
    for (var _i = 0, rawLiterals_1 = rawLiterals; _i < rawLiterals_1.length; _i++) {
        var literal = rawLiterals_1[_i];
        base = base.replace(literal.trim(), '');
    }
    // find remaining params in base
    var rawParams = base.match(/[a-z]+:[a-z-\.@\d:"]+/gi) || [];
    for (var _a = 0, rawParams_1 = rawParams; _a < rawParams_1.length; _a++) {
        var param = rawParams_1[_a];
        base = base.replace(param, '');
    }
    base = base.trim();
    var params = rawParams.reduce(function (params, param) {
        var _a = param.split(/:/), name = _a[0], value = _a.slice(1);
        params[name] = value.join(':').replace(/"/g, ''); // dates can contain additional colons
        return params;
    }, {});
    var literals = rawLiterals.map(function (l) { return String(l).trim(); });
    return {
        query: [base, literals.join(' ')].filter(Boolean).join(' '),
        params: params,
    };
}
export function makeSearchQuery(query, params) {
    return [
        query,
        Object.entries(params)
            .filter(function (_a) {
            var _ = _a[0], value = _a[1];
            return value;
        })
            .map(function (_a) {
            var name = _a[0], value = _a[1];
            return "".concat(name, ":").concat(value);
        })
            .join(' '),
    ]
        .filter(Boolean)
        .join(' ');
}
