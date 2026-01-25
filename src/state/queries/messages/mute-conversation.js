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
import { useMutation, useQueryClient, } from '@tanstack/react-query';
import { DM_SERVICE_HEADERS } from '#/lib/constants';
import { useAgent } from '#/state/session';
import { RQKEY as CONVO_KEY } from './conversation';
import { RQKEY_ROOT as CONVO_LIST_KEY } from './list-conversations';
export function useMuteConvo(convoId, _a) {
    var _this = this;
    var onSuccess = _a.onSuccess, onError = _a.onError;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var data, data;
            var mute = _b.mute;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!convoId)
                            throw new Error('No convoId provided');
                        if (!mute) return [3 /*break*/, 2];
                        return [4 /*yield*/, agent.api.chat.bsky.convo.muteConvo({ convoId: convoId }, { headers: DM_SERVICE_HEADERS, encoding: 'application/json' })];
                    case 1:
                        data = (_c.sent()).data;
                        return [2 /*return*/, data];
                    case 2: return [4 /*yield*/, agent.api.chat.bsky.convo.unmuteConvo({ convoId: convoId }, { headers: DM_SERVICE_HEADERS, encoding: 'application/json' })];
                    case 3:
                        data = (_c.sent()).data;
                        return [2 /*return*/, data];
                }
            });
        }); },
        onSuccess: function (data, params) {
            queryClient.setQueryData(CONVO_KEY(data.convo.id), function (prev) {
                if (!prev)
                    return;
                return __assign(__assign({}, prev), { muted: params.mute });
            });
            queryClient.setQueryData([CONVO_LIST_KEY], function (prev) {
                if (!(prev === null || prev === void 0 ? void 0 : prev.pages))
                    return;
                return __assign(__assign({}, prev), { pages: prev.pages.map(function (page) { return (__assign(__assign({}, page), { convos: page.convos.map(function (convo) {
                            if (convo.id !== data.convo.id)
                                return convo;
                            return __assign(__assign({}, convo), { muted: params.mute });
                        }) })); }) });
            });
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(data);
        },
        onError: function (e) {
            onError === null || onError === void 0 ? void 0 : onError(e);
        },
    });
}
