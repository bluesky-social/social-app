var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { t } from '@lingui/macro';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, } from '@tanstack/react-query';
import { useAgent, useSession } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
export var RQKEY_getActivitySubscriptions = ['activity-subscriptions'];
export var RQKEY_getNotificationDeclaration = ['notification-declaration'];
export function useActivitySubscriptionsQuery() {
    var _this = this;
    var agent = useAgent();
    return useInfiniteQuery({
        queryKey: RQKEY_getActivitySubscriptions,
        queryFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var response;
            var pageParam = _b.pageParam;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.notification.listActivitySubscriptions({
                            cursor: pageParam,
                        })];
                    case 1:
                        response = _c.sent();
                        return [2 /*return*/, response.data];
                }
            });
        }); },
        initialPageParam: undefined,
        getNextPageParam: function (prev) { return prev.cursor; },
    });
}
export function useNotificationDeclarationQuery() {
    var _this = this;
    var agent = useAgent();
    var currentAccount = useSession().currentAccount;
    return useQuery({
        queryKey: RQKEY_getNotificationDeclaration,
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, agent.app.bsky.notification.declaration.get({
                                repo: currentAccount.did,
                                rkey: 'self',
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                    case 2:
                        err_1 = _a.sent();
                        if (err_1 instanceof Error &&
                            err_1.message.startsWith('Could not locate record')) {
                            return [2 /*return*/, {
                                    value: {
                                        $type: 'app.bsky.notification.declaration',
                                        allowSubscriptions: 'followers',
                                    },
                                }];
                        }
                        else {
                            throw err_1;
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useNotificationDeclarationMutation() {
    var _this = this;
    var agent = useAgent();
    var currentAccount = useSession().currentAccount;
    var queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (record) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.notification.declaration.put({
                            repo: currentAccount.did,
                            rkey: 'self',
                        }, record)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        }); },
        onMutate: function (value) {
            queryClient.setQueryData(RQKEY_getNotificationDeclaration, function (old) {
                if (!old)
                    return old;
                return {
                    value: value,
                };
            });
        },
        onError: function () {
            Toast.show(t(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Failed to update notification declaration"], ["Failed to update notification declaration"]))));
            queryClient.invalidateQueries({
                queryKey: RQKEY_getNotificationDeclaration,
            });
        },
    });
}
export function findAllProfilesInQueryData(queryClient, did) {
    var queryDatas, _i, queryDatas_1, _a, _queryKey, queryData, _b, _c, page, _d, _e, subscription;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                queryDatas = queryClient.getQueriesData({
                    queryKey: RQKEY_getActivitySubscriptions,
                });
                _i = 0, queryDatas_1 = queryDatas;
                _f.label = 1;
            case 1:
                if (!(_i < queryDatas_1.length)) return [3 /*break*/, 8];
                _a = queryDatas_1[_i], _queryKey = _a[0], queryData = _a[1];
                if (!(queryData === null || queryData === void 0 ? void 0 : queryData.pages)) {
                    return [3 /*break*/, 7];
                }
                _b = 0, _c = queryData.pages;
                _f.label = 2;
            case 2:
                if (!(_b < _c.length)) return [3 /*break*/, 7];
                page = _c[_b];
                _d = 0, _e = page.subscriptions;
                _f.label = 3;
            case 3:
                if (!(_d < _e.length)) return [3 /*break*/, 6];
                subscription = _e[_d];
                if (!(subscription.did === did)) return [3 /*break*/, 5];
                return [4 /*yield*/, subscription];
            case 4:
                _f.sent();
                _f.label = 5;
            case 5:
                _d++;
                return [3 /*break*/, 3];
            case 6:
                _b++;
                return [3 /*break*/, 2];
            case 7:
                _i++;
                return [3 /*break*/, 1];
            case 8: return [2 /*return*/];
        }
    });
}
var templateObject_1;
