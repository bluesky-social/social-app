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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { MAX_LABELERS } from '#/lib/constants';
import { labelersDetailedInfoQueryKeyRoot } from '#/lib/react-query';
import { STALE } from '#/state/queries';
import { preferencesQueryKey, usePreferencesQuery, } from '#/state/queries/preferences';
import { useAgent } from '#/state/session';
var labelerInfoQueryKeyRoot = 'labeler-info';
export var labelerInfoQueryKey = function (did) { return [
    labelerInfoQueryKeyRoot,
    did,
]; };
var labelersInfoQueryKeyRoot = 'labelers-info';
export var labelersInfoQueryKey = function (dids) { return [
    labelersInfoQueryKeyRoot,
    dids.slice().sort(),
]; };
export var labelersDetailedInfoQueryKey = function (dids) { return [
    labelersDetailedInfoQueryKeyRoot,
    dids,
]; };
export function useLabelerInfoQuery(_a) {
    var _this = this;
    var did = _a.did, enabled = _a.enabled;
    var agent = useAgent();
    return useQuery({
        enabled: !!did && enabled !== false,
        queryKey: labelerInfoQueryKey(did),
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.labeler.getServices({
                            dids: [did],
                            detailed: true,
                        })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data.views[0]];
                }
            });
        }); },
    });
}
export function useLabelersInfoQuery(_a) {
    var _this = this;
    var dids = _a.dids;
    var agent = useAgent();
    return useQuery({
        enabled: !!dids.length,
        queryKey: labelersInfoQueryKey(dids),
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.labeler.getServices({ dids: dids })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data.views];
                }
            });
        }); },
    });
}
export function useLabelersDetailedInfoQuery(_a) {
    var _this = this;
    var dids = _a.dids;
    var agent = useAgent();
    return useQuery({
        enabled: !!dids.length,
        queryKey: labelersDetailedInfoQueryKey(dids),
        gcTime: 1000 * 60 * 60 * 6, // 6 hours
        staleTime: STALE.MINUTES.ONE,
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.labeler.getServices({
                            dids: dids,
                            detailed: true,
                        })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data.views];
                }
            });
        }); },
    });
}
export function useLabelerSubscriptionMutation() {
    var queryClient = useQueryClient();
    var agent = useAgent();
    var preferences = usePreferencesQuery();
    return useMutation({
        mutationFn: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var labelerDids, invalidLabelers, profiles, _loop_1, _i, labelerDids_1, did_1, labelerCount;
                var _c, _d, _e;
                var did = _b.did, subscribe = _b.subscribe;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            // TODO
                            z.object({
                                did: z.string(),
                                subscribe: z.boolean(),
                            }).parse({ did: did, subscribe: subscribe });
                            labelerDids = ((_e = (_d = (_c = preferences.data) === null || _c === void 0 ? void 0 : _c.moderationPrefs) === null || _d === void 0 ? void 0 : _d.labelers) !== null && _e !== void 0 ? _e : []).map(function (l) { return l.did; });
                            invalidLabelers = [];
                            if (!labelerDids.length) return [3 /*break*/, 2];
                            return [4 /*yield*/, agent.getProfiles({ actors: labelerDids })];
                        case 1:
                            profiles = _f.sent();
                            if (profiles.data) {
                                _loop_1 = function (did_1) {
                                    var exists = profiles.data.profiles.find(function (p) { return p.did === did_1; });
                                    if (exists) {
                                        // profile came back but it's not a valid labeler
                                        if (exists.associated && !exists.associated.labeler) {
                                            invalidLabelers.push(did_1);
                                        }
                                    }
                                    else {
                                        // no response came back, might be deactivated or takendown
                                        invalidLabelers.push(did_1);
                                    }
                                };
                                for (_i = 0, labelerDids_1 = labelerDids; _i < labelerDids_1.length; _i++) {
                                    did_1 = labelerDids_1[_i];
                                    _loop_1(did_1);
                                }
                            }
                            _f.label = 2;
                        case 2:
                            if (!invalidLabelers.length) return [3 /*break*/, 4];
                            return [4 /*yield*/, Promise.all(invalidLabelers.map(function (did) { return agent.removeLabeler(did); }))];
                        case 3:
                            _f.sent();
                            _f.label = 4;
                        case 4:
                            if (!subscribe) return [3 /*break*/, 6];
                            labelerCount = labelerDids.length - invalidLabelers.length;
                            if (labelerCount >= MAX_LABELERS) {
                                throw new Error('MAX_LABELERS');
                            }
                            return [4 /*yield*/, agent.addLabeler(did)];
                        case 5:
                            _f.sent();
                            return [3 /*break*/, 8];
                        case 6: return [4 /*yield*/, agent.removeLabeler(did)];
                        case 7:
                            _f.sent();
                            _f.label = 8;
                        case 8: return [2 /*return*/];
                    }
                });
            });
        },
        onSuccess: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        },
    });
}
