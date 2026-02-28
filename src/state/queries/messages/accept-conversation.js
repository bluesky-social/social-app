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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DM_SERVICE_HEADERS } from '#/lib/constants';
import { logger } from '#/logger';
import { useAgent } from '#/state/session';
import { RQKEY as CONVO_LIST_KEY, RQKEY_ROOT as CONVO_LIST_ROOT_KEY, } from './list-conversations';
export function useAcceptConversation(convoId, _a) {
    var _this = this;
    var onSuccess = _a.onSuccess, onMutate = _a.onMutate, onError = _a.onError;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.chat.bsky.convo.acceptConvo({ convoId: convoId }, { headers: DM_SERVICE_HEADERS })];
                    case 1:
                        data = (_a.sent()).data;
                        return [2 /*return*/, data];
                }
            });
        }); },
        onMutate: function () {
            var prevAcceptedPages = [];
            var prevInboxPages = [];
            var convoBeingAccepted;
            queryClient.setQueryData(CONVO_LIST_KEY('request'), function (old) {
                if (!old)
                    return old;
                prevInboxPages = old.pages;
                return __assign(__assign({}, old), { pages: old.pages.map(function (page) {
                        var found = page.convos.find(function (convo) { return convo.id === convoId; });
                        if (found) {
                            convoBeingAccepted = found;
                            return __assign(__assign({}, page), { convos: page.convos.filter(function (convo) { return convo.id !== convoId; }) });
                        }
                        return page;
                    }) });
            });
            queryClient.setQueryData(CONVO_LIST_KEY('accepted'), function (old) {
                if (!old)
                    return old;
                prevAcceptedPages = old.pages;
                if (convoBeingAccepted) {
                    return __assign(__assign({}, old), { pages: __spreadArray([
                            __assign(__assign({}, old.pages[0]), { convos: __spreadArray([
                                    __assign(__assign({}, convoBeingAccepted), { status: 'accepted' })
                                ], old.pages[0].convos, true) })
                        ], old.pages.slice(1), true) });
                }
                else {
                    return old;
                }
            });
            onMutate === null || onMutate === void 0 ? void 0 : onMutate();
            return { prevAcceptedPages: prevAcceptedPages, prevInboxPages: prevInboxPages };
        },
        onSuccess: function (data) {
            queryClient.invalidateQueries({ queryKey: [CONVO_LIST_KEY] });
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(data);
        },
        onError: function (error, _, context) {
            logger.error(error);
            queryClient.setQueryData(CONVO_LIST_KEY('accepted'), function (old) {
                if (!old)
                    return old;
                return __assign(__assign({}, old), { pages: (context === null || context === void 0 ? void 0 : context.prevAcceptedPages) || old.pages });
            });
            queryClient.setQueryData(CONVO_LIST_KEY('request'), function (old) {
                if (!old)
                    return old;
                return __assign(__assign({}, old), { pages: (context === null || context === void 0 ? void 0 : context.prevInboxPages) || old.pages });
            });
            queryClient.invalidateQueries({ queryKey: [CONVO_LIST_ROOT_KEY] });
            onError === null || onError === void 0 ? void 0 : onError(error);
        },
    });
}
