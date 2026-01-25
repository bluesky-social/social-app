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
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE } from '#/state/queries';
import { useAgent } from '#/state/session';
var handleQueryKeyRoot = 'handle';
var fetchHandleQueryKey = function (handleOrDid) { return [
    handleQueryKeyRoot,
    handleOrDid,
]; };
var didQueryKeyRoot = 'did';
var fetchDidQueryKey = function (handleOrDid) { return [didQueryKeyRoot, handleOrDid]; };
export function useFetchHandle() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return React.useCallback(function (handleOrDid) { return __awaiter(_this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!handleOrDid.startsWith('did:')) return [3 /*break*/, 2];
                    return [4 /*yield*/, queryClient.fetchQuery({
                            staleTime: STALE.MINUTES.FIVE,
                            queryKey: fetchHandleQueryKey(handleOrDid),
                            queryFn: function () { return agent.getProfile({ actor: handleOrDid }); },
                        })];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.data.handle];
                case 2: return [2 /*return*/, handleOrDid];
            }
        });
    }); }, [queryClient, agent]);
}
export function useUpdateHandleMutation(opts) {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var handle = _b.handle;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, agent.updateHandle({ handle: handle })];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (_data, variables) {
            var _a;
            (_a = opts === null || opts === void 0 ? void 0 : opts.onSuccess) === null || _a === void 0 ? void 0 : _a.call(opts, variables.handle);
            queryClient.invalidateQueries({
                queryKey: fetchHandleQueryKey(variables.handle),
            });
        },
    });
}
export function useFetchDid() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return React.useCallback(function (handleOrDid) { return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, queryClient.fetchQuery({
                    staleTime: STALE.INFINITY,
                    queryKey: fetchDidQueryKey(handleOrDid),
                    queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                        var identifier, res;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    identifier = handleOrDid;
                                    if (!!identifier.startsWith('did:')) return [3 /*break*/, 2];
                                    return [4 /*yield*/, agent.resolveHandle({ handle: identifier })];
                                case 1:
                                    res = _a.sent();
                                    identifier = res.data.did;
                                    _a.label = 2;
                                case 2: return [2 /*return*/, identifier];
                            }
                        });
                    }); },
                })];
        });
    }); }, [queryClient, agent]);
}
