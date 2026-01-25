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
import { ComAtprotoTempCheckHandleAvailability } from '@atproto/api';
import { useQuery } from '@tanstack/react-query';
import { BSKY_SERVICE, BSKY_SERVICE_DID, PUBLIC_BSKY_SERVICE, } from '#/lib/constants';
import { createFullHandle } from '#/lib/strings/handles';
import { useDebouncedValue } from '#/components/live/utils';
import { useAnalytics } from '#/analytics';
import * as bsky from '#/types/bsky';
import { Agent } from '../session/agent';
export var RQKEY_handleAvailability = function (handle, domain, serviceDid) { return ['handle-availability', { handle: handle, domain: domain, serviceDid: serviceDid }]; };
export function useHandleAvailabilityQuery(_a, debounceDelayMs) {
    var _this = this;
    var username = _a.username, serviceDomain = _a.serviceDomain, serviceDid = _a.serviceDid, enabled = _a.enabled, birthDate = _a.birthDate, email = _a.email;
    if (debounceDelayMs === void 0) { debounceDelayMs = 500; }
    var ax = useAnalytics();
    var name = username.trim();
    var debouncedHandle = useDebouncedValue(name, debounceDelayMs);
    return {
        debouncedUsername: debouncedHandle,
        enabled: enabled && name === debouncedHandle,
        query: useQuery({
            enabled: enabled && name === debouncedHandle,
            queryKey: RQKEY_handleAvailability(debouncedHandle, serviceDomain, serviceDid),
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var handle, res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            handle = createFullHandle(name, serviceDomain);
                            return [4 /*yield*/, checkHandleAvailability(handle, serviceDid, {
                                    email: email,
                                    birthDate: birthDate,
                                })];
                        case 1:
                            res = _a.sent();
                            if (res.available) {
                                ax.metric('signup:handleAvailable', { typeahead: true });
                            }
                            else {
                                ax.metric('signup:handleTaken', { typeahead: true });
                            }
                            return [2 /*return*/, res];
                    }
                });
            }); },
        }),
    };
}
export function checkHandleAvailability(handle_1, serviceDid_1, _a) {
    return __awaiter(this, arguments, void 0, function (handle, serviceDid, _b) {
        var agent, data, agent, res, _c;
        var email = _b.email, birthDate = _b.birthDate;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!(serviceDid === BSKY_SERVICE_DID)) return [3 /*break*/, 2];
                    agent = new Agent(null, { service: BSKY_SERVICE });
                    return [4 /*yield*/, agent.com.atproto.temp.checkHandleAvailability({
                            handle: handle,
                            birthDate: birthDate,
                            email: email,
                        })];
                case 1:
                    data = (_d.sent()).data;
                    if (bsky.dangerousIsType(data.result, ComAtprotoTempCheckHandleAvailability.isResultAvailable)) {
                        return [2 /*return*/, { available: true }];
                    }
                    else if (bsky.dangerousIsType(data.result, ComAtprotoTempCheckHandleAvailability.isResultUnavailable)) {
                        return [2 /*return*/, {
                                available: false,
                                suggestions: data.result.suggestions,
                            }];
                    }
                    else {
                        throw new Error("Unexpected result of `checkHandleAvailability`: ".concat(JSON.stringify(data.result)));
                    }
                    return [3 /*break*/, 7];
                case 2:
                    agent = new Agent(null, { service: PUBLIC_BSKY_SERVICE });
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, agent.resolveHandle({
                            handle: handle,
                        })];
                case 4:
                    res = _d.sent();
                    if (res.data.did) {
                        return [2 /*return*/, { available: false }];
                    }
                    return [3 /*break*/, 6];
                case 5:
                    _c = _d.sent();
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/, { available: true }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
