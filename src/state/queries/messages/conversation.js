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
import { useMutation, useQuery, useQueryClient, } from '@tanstack/react-query';
import { DM_SERVICE_HEADERS } from '#/lib/constants';
import { STALE } from '#/state/queries';
import { useOnMarkAsRead } from '#/state/queries/messages/list-conversations';
import { useAgent } from '#/state/session';
import { getConvoFromQueryData, RQKEY_ROOT as LIST_CONVOS_KEY, } from './list-conversations';
var RQKEY_ROOT = 'convo';
export var RQKEY = function (convoId) { return [RQKEY_ROOT, convoId]; };
export function useConvoQuery(convo) {
    var _this = this;
    var agent = useAgent();
    return useQuery({
        queryKey: RQKEY(convo.id),
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.chat.bsky.convo.getConvo({ convoId: convo.id }, { headers: DM_SERVICE_HEADERS })];
                    case 1:
                        data = (_a.sent()).data;
                        return [2 /*return*/, data.convo];
                }
            });
        }); },
        initialData: convo,
        staleTime: STALE.INFINITY,
    });
}
export function precacheConvoQuery(queryClient, convo) {
    queryClient.setQueryData(RQKEY(convo.id), convo);
}
export function useMarkAsReadMutation() {
    var _this = this;
    var optimisticUpdate = useOnMarkAsRead();
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var convoId = _b.convoId, messageId = _b.messageId;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!convoId)
                            throw new Error('No convoId provided');
                        return [4 /*yield*/, agent.api.chat.bsky.convo.updateRead({
                                convoId: convoId,
                                messageId: messageId,
                            }, {
                                encoding: 'application/json',
                                headers: DM_SERVICE_HEADERS,
                            })];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onMutate: function (_a) {
            var convoId = _a.convoId;
            if (!convoId)
                throw new Error('No convoId provided');
            optimisticUpdate(convoId);
        },
        onSuccess: function (_, _a) {
            var convoId = _a.convoId;
            if (!convoId)
                return;
            queryClient.setQueriesData({ queryKey: [LIST_CONVOS_KEY] }, function (old) {
                if (!old)
                    return old;
                var existingConvo = getConvoFromQueryData(convoId, old);
                if (existingConvo) {
                    return __assign(__assign({}, old), { pages: old.pages.map(function (page) {
                            return __assign(__assign({}, page), { convos: page.convos.map(function (convo) {
                                    if (convo.id === convoId) {
                                        return __assign(__assign({}, convo), { unreadCount: 0 });
                                    }
                                    return convo;
                                }) });
                        }) });
                }
                else {
                    // If we somehow marked a convo as read that doesn't exist in the
                    // list, then we don't need to do anything.
                }
            });
        },
    });
}
