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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseAppNux, serializeAppNux } from '#/state/queries/nuxs/util';
import { preferencesQueryKey, usePreferencesQuery, } from '#/state/queries/preferences';
import { useAgent } from '#/state/session';
export { Nux } from '#/state/queries/nuxs/definitions';
export function useNuxs() {
    var _a, _b, _c;
    var _d = usePreferencesQuery(), data = _d.data, isSuccess = _d.isSuccess, isError = _d.isError;
    var status = isSuccess ? 'ready' : isError ? 'error' : 'loading';
    if (status === 'ready') {
        var nuxs = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.bskyAppState) === null || _a === void 0 ? void 0 : _a.nuxs) === null || _b === void 0 ? void 0 : _b.map(parseAppNux)) === null || _c === void 0 ? void 0 : _c.filter(Boolean);
        if (nuxs) {
            return {
                nuxs: nuxs,
                status: status,
            };
        }
        else {
            return {
                nuxs: [],
                status: status,
            };
        }
    }
    // if (__DEV__) {
    //   const queryClient = useQueryClient()
    //   const agent = useAgent()
    //   // @ts-ignore
    //   window.clearNux = async (ids: string[]) => {
    //     await agent.bskyAppRemoveNuxs(ids)
    //     // triggers a refetch
    //     await queryClient.invalidateQueries({
    //       queryKey: preferencesQueryKey,
    //     })
    //   }
    // }
    return {
        nuxs: undefined,
        status: status,
    };
}
export function useNux(id) {
    var _a = useNuxs(), nuxs = _a.nuxs, status = _a.status;
    if (status === 'ready') {
        var nux = nuxs.find(function (nux) { return nux.id === id; });
        if (nux) {
            return {
                nux: nux,
                status: status,
            };
        }
        else {
            return {
                nux: undefined,
                status: status,
            };
        }
    }
    return {
        nux: undefined,
        status: status,
    };
}
export function useSaveNux() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        retry: 3,
        mutationFn: function (nux) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.bskyAppUpsertNux(serializeAppNux(nux))
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useResetNuxs() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        retry: 3,
        mutationFn: function (ids) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.bskyAppRemoveNuxs(ids)
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
