var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { nuxSchema } from '@atproto/api';
import { nuxNames, NuxSchemas, } from '#/state/queries/nuxs/definitions';
export function parseAppNux(nux) {
    if (!nuxNames.has(nux.id))
        return;
    if (!nuxSchema.safeParse(nux).success)
        return;
    var data = nux.data, rest = __rest(nux, ["data"]);
    var schema = NuxSchemas[nux.id];
    if (schema && data) {
        var parsedData = JSON.parse(data);
        if (!schema.safeParse(parsedData).success)
            return;
        return __assign(__assign({}, rest), { data: parsedData });
    }
    return __assign(__assign({}, rest), { data: undefined });
}
export function serializeAppNux(nux) {
    var data = nux.data, rest = __rest(nux, ["data"]);
    var schema = NuxSchemas[nux.id];
    var result = __assign(__assign({}, rest), { data: undefined });
    if (schema) {
        schema.parse(data);
        result.data = JSON.stringify(data);
    }
    nuxSchema.parse(result);
    return result;
}
