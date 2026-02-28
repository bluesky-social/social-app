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
import { useQuery } from '@tanstack/react-query';
import { createBskyTopicsHeader } from '#/lib/api/feed/utils';
import { logger } from '#/logger';
import { getContentLanguages } from '#/state/preferences/languages';
import { STALE } from '#/state/queries';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useAgent } from '#/state/session';
export var getSuggestedOnboardingUsersQueryKeyRoot = 'unspecced-suggested-onboarding-users';
export var createGetSuggestedOnboardingUsersQueryKey = function (props) { return [
    getSuggestedOnboardingUsersQueryKeyRoot,
    props.category,
    props.limit,
    props.overrideInterests.join(','),
]; };
export function useGetSuggestedOnboardingUsersQuery(props) {
    var _this = this;
    var agent = useAgent();
    var preferences = usePreferencesQuery().data;
    return useQuery({
        enabled: !!preferences && props.enabled !== false,
        staleTime: STALE.MINUTES.THREE,
        queryKey: createGetSuggestedOnboardingUsersQueryKey(props),
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var contentLangs, overrideInterests, data, fallbackData;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        contentLangs = getContentLanguages().join(',');
                        overrideInterests = props.overrideInterests.join(',');
                        return [4 /*yield*/, agent.app.bsky.unspecced.getSuggestedOnboardingUsers({
                                category: (_a = props.category) !== null && _a !== void 0 ? _a : undefined,
                                limit: props.limit || 10,
                            }, {
                                headers: __assign(__assign({}, createBskyTopicsHeader(overrideInterests)), { 'Accept-Language': contentLangs }),
                            })
                            // FALLBACK: if no results for 'all', try again with no interests specified
                        ];
                    case 1:
                        data = (_c.sent()).data;
                        if (!(!props.category && data.actors.length === 0)) return [3 /*break*/, 3];
                        logger.error("Did not get any suggested onboarding users, falling back - interests: ".concat(overrideInterests));
                        return [4 /*yield*/, agent.app.bsky.unspecced.getSuggestedOnboardingUsers({
                                category: (_b = props.category) !== null && _b !== void 0 ? _b : undefined,
                                limit: props.limit || 10,
                            }, {
                                headers: {
                                    'Accept-Language': contentLangs,
                                },
                            })];
                    case 2:
                        fallbackData = (_c.sent()).data;
                        return [2 /*return*/, fallbackData];
                    case 3: return [2 /*return*/, data];
                }
            });
        }); },
    });
}
export function findAllProfilesInQueryData(queryClient, did) {
    var responses, _i, responses_1, _a, _key, response, _b, _c, actor;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                responses = queryClient.getQueriesData({
                    queryKey: [getSuggestedOnboardingUsersQueryKeyRoot],
                });
                _i = 0, responses_1 = responses;
                _d.label = 1;
            case 1:
                if (!(_i < responses_1.length)) return [3 /*break*/, 6];
                _a = responses_1[_i], _key = _a[0], response = _a[1];
                if (!response) {
                    return [3 /*break*/, 5];
                }
                _b = 0, _c = response.actors;
                _d.label = 2;
            case 2:
                if (!(_b < _c.length)) return [3 /*break*/, 5];
                actor = _c[_b];
                if (!(actor.did === did)) return [3 /*break*/, 4];
                return [4 /*yield*/, actor];
            case 3:
                _d.sent();
                _d.label = 4;
            case 4:
                _b++;
                return [3 /*break*/, 2];
            case 5:
                _i++;
                return [3 /*break*/, 1];
            case 6: return [2 /*return*/];
        }
    });
}
