var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { APP_CONFIG_URL } from '#/env';
var qc = new QueryClient();
var appConfigQueryKey = ['app-config'];
export var DEFAULT_APP_CONFIG_RESPONSE = {
    liveNow: {
        allow: [],
        exceptions: [],
    },
};
var fetchAppConfigPromise;
function fetchAppConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var e_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!fetchAppConfigPromise) {
                        fetchAppConfigPromise = (function () { return __awaiter(_this, void 0, void 0, function () {
                            var r, _a, data;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, fetch("".concat(APP_CONFIG_URL, "/config"))];
                                    case 1:
                                        r = _b.sent();
                                        if (!!r.ok) return [3 /*break*/, 3];
                                        _a = Error.bind;
                                        return [4 /*yield*/, r.text()];
                                    case 2: throw new (_a.apply(Error, [void 0, _b.sent()]))();
                                    case 3: return [4 /*yield*/, r.json()];
                                    case 4:
                                        data = _b.sent();
                                        return [2 /*return*/, data];
                                }
                            });
                        }); })();
                    }
                    return [4 /*yield*/, fetchAppConfigPromise];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    e_1 = _a.sent();
                    fetchAppConfigPromise = undefined;
                    throw e_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
var Context = createContext(DEFAULT_APP_CONFIG_RESPONSE);
export function Provider(_a) {
    var children = _a.children;
    var data = useQuery({
        staleTime: Infinity,
        queryKey: appConfigQueryKey,
        refetchInterval: function (query) {
            // refetch regularly if fetch failed, otherwise never refetch
            return query.state.status === 'error' ? 60e3 : Infinity;
        },
        queryFn: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, fetchAppConfig()];
                });
            });
        },
    }, qc).data;
    return (_jsx(Context.Provider, { value: data !== null && data !== void 0 ? data : DEFAULT_APP_CONFIG_RESPONSE, children: children }));
}
export function prefetchAppConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetchAppConfig()];
                case 1:
                    data = _b.sent();
                    if (data) {
                        qc.setQueryData(appConfigQueryKey, data);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
export function useAppConfig() {
    var ctx = useContext(Context);
    if (!ctx) {
        throw new Error('useAppConfig must be used within a Provider');
    }
    return ctx;
}
