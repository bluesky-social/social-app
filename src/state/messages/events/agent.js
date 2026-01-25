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
import EventEmitter from 'eventemitter3';
import { nanoid } from 'nanoid/non-secure';
import { networkRetry } from '#/lib/async/retry';
import { DM_SERVICE_HEADERS } from '#/lib/constants';
import { isErrorMaybeAppPasswordPermissions, isNetworkError, } from '#/lib/strings/errors';
import { Logger } from '#/logger';
import { BACKGROUND_POLL_INTERVAL, DEFAULT_POLL_INTERVAL, } from '#/state/messages/events/const';
import { MessagesEventBusDispatchEvent, MessagesEventBusErrorCode, MessagesEventBusStatus, } from '#/state/messages/events/types';
var logger = Logger.create(Logger.Context.DMsAgent);
var MessagesEventBus = /** @class */ (function () {
    function MessagesEventBus(params) {
        this.emitter = new EventEmitter();
        this.status = MessagesEventBusStatus.Initializing;
        this.latestRev = undefined;
        this.pollInterval = DEFAULT_POLL_INTERVAL;
        this.requestedPollIntervals = new Map();
        /*
         * Polling
         */
        this.isPolling = false;
        this.id = nanoid(3);
        this.agent = params.agent;
        this.init();
    }
    MessagesEventBus.prototype.requestPollInterval = function (interval) {
        var _this = this;
        var id = nanoid();
        this.requestedPollIntervals.set(id, interval);
        this.dispatch({
            event: MessagesEventBusDispatchEvent.UpdatePoll,
        });
        return function () {
            _this.requestedPollIntervals.delete(id);
            _this.dispatch({
                event: MessagesEventBusDispatchEvent.UpdatePoll,
            });
        };
    };
    MessagesEventBus.prototype.getLatestRev = function () {
        return this.latestRev;
    };
    MessagesEventBus.prototype.on = function (handler, options) {
        var _this = this;
        var handle = function (event) {
            if (event.type === 'logs' && options.convoId) {
                var filteredLogs = event.logs.filter(function (log) {
                    if ('convoId' in log && log.convoId === options.convoId) {
                        return log.convoId === options.convoId;
                    }
                    return false;
                });
                if (filteredLogs.length > 0) {
                    handler(__assign(__assign({}, event), { logs: filteredLogs }));
                }
            }
            else {
                handler(event);
            }
        };
        this.emitter.on('event', handle);
        return function () {
            _this.emitter.off('event', handle);
        };
    };
    MessagesEventBus.prototype.background = function () {
        logger.debug("background", {});
        this.dispatch({ event: MessagesEventBusDispatchEvent.Background });
    };
    MessagesEventBus.prototype.suspend = function () {
        logger.debug("suspend", {});
        this.dispatch({ event: MessagesEventBusDispatchEvent.Suspend });
    };
    MessagesEventBus.prototype.resume = function () {
        logger.debug("resume", {});
        this.dispatch({ event: MessagesEventBusDispatchEvent.Resume });
    };
    MessagesEventBus.prototype.dispatch = function (action) {
        var prevStatus = this.status;
        switch (this.status) {
            case MessagesEventBusStatus.Initializing: {
                switch (action.event) {
                    case MessagesEventBusDispatchEvent.Ready: {
                        this.status = MessagesEventBusStatus.Ready;
                        this.resetPoll();
                        this.emitter.emit('event', { type: 'connect' });
                        break;
                    }
                    case MessagesEventBusDispatchEvent.Background: {
                        this.status = MessagesEventBusStatus.Backgrounded;
                        this.resetPoll();
                        this.emitter.emit('event', { type: 'connect' });
                        break;
                    }
                    case MessagesEventBusDispatchEvent.Suspend: {
                        this.status = MessagesEventBusStatus.Suspended;
                        break;
                    }
                    case MessagesEventBusDispatchEvent.Error: {
                        this.status = MessagesEventBusStatus.Error;
                        this.emitter.emit('event', { type: 'error', error: action.payload });
                        break;
                    }
                }
                break;
            }
            case MessagesEventBusStatus.Ready: {
                switch (action.event) {
                    case MessagesEventBusDispatchEvent.Background: {
                        this.status = MessagesEventBusStatus.Backgrounded;
                        this.resetPoll();
                        break;
                    }
                    case MessagesEventBusDispatchEvent.Suspend: {
                        this.status = MessagesEventBusStatus.Suspended;
                        this.stopPoll();
                        break;
                    }
                    case MessagesEventBusDispatchEvent.Error: {
                        this.status = MessagesEventBusStatus.Error;
                        this.stopPoll();
                        this.emitter.emit('event', { type: 'error', error: action.payload });
                        break;
                    }
                    case MessagesEventBusDispatchEvent.UpdatePoll: {
                        this.resetPoll();
                        break;
                    }
                }
                break;
            }
            case MessagesEventBusStatus.Backgrounded: {
                switch (action.event) {
                    case MessagesEventBusDispatchEvent.Resume: {
                        this.status = MessagesEventBusStatus.Ready;
                        this.resetPoll();
                        break;
                    }
                    case MessagesEventBusDispatchEvent.Suspend: {
                        this.status = MessagesEventBusStatus.Suspended;
                        this.stopPoll();
                        break;
                    }
                    case MessagesEventBusDispatchEvent.Error: {
                        this.status = MessagesEventBusStatus.Error;
                        this.stopPoll();
                        this.emitter.emit('event', { type: 'error', error: action.payload });
                        break;
                    }
                    case MessagesEventBusDispatchEvent.UpdatePoll: {
                        this.resetPoll();
                        break;
                    }
                }
                break;
            }
            case MessagesEventBusStatus.Suspended: {
                switch (action.event) {
                    case MessagesEventBusDispatchEvent.Resume: {
                        this.status = MessagesEventBusStatus.Ready;
                        this.resetPoll();
                        break;
                    }
                    case MessagesEventBusDispatchEvent.Background: {
                        this.status = MessagesEventBusStatus.Backgrounded;
                        this.resetPoll();
                        break;
                    }
                    case MessagesEventBusDispatchEvent.Error: {
                        this.status = MessagesEventBusStatus.Error;
                        this.stopPoll();
                        this.emitter.emit('event', { type: 'error', error: action.payload });
                        break;
                    }
                }
                break;
            }
            case MessagesEventBusStatus.Error: {
                switch (action.event) {
                    case MessagesEventBusDispatchEvent.UpdatePoll: {
                        // basically reset
                        this.status = MessagesEventBusStatus.Initializing;
                        this.latestRev = undefined;
                        this.init();
                        break;
                    }
                    case MessagesEventBusDispatchEvent.Resume: {
                        this.status = MessagesEventBusStatus.Ready;
                        this.resetPoll();
                        this.emitter.emit('event', { type: 'connect' });
                        break;
                    }
                }
                break;
            }
            default:
                break;
        }
        logger.debug("dispatch '".concat(action.event, "'"), {
            id: this.id,
            prev: prevStatus,
            next: this.status,
        });
    };
    MessagesEventBus.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, cursor, e_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.debug("init", {});
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, networkRetry(2, function () {
                                return _this.agent.chat.bsky.convo.getLog({}, { headers: DM_SERVICE_HEADERS });
                            })
                            // throw new Error('UNCOMMENT TO TEST INIT FAILURE')
                        ];
                    case 2:
                        response = _a.sent();
                        cursor = response.data.cursor;
                        // should always be defined
                        if (cursor) {
                            if (!this.latestRev) {
                                this.latestRev = cursor;
                            }
                            else if (cursor > this.latestRev) {
                                this.latestRev = cursor;
                            }
                        }
                        this.dispatch({ event: MessagesEventBusDispatchEvent.Ready });
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        if (!isNetworkError(e_1) && !isErrorMaybeAppPasswordPermissions(e_1)) {
                            logger.error("init failed", {
                                safeMessage: e_1.message,
                            });
                        }
                        this.dispatch({
                            event: MessagesEventBusDispatchEvent.Error,
                            payload: {
                                exception: e_1,
                                code: MessagesEventBusErrorCode.InitFailed,
                                retry: function () {
                                    _this.dispatch({ event: MessagesEventBusDispatchEvent.Resume });
                                },
                            },
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MessagesEventBus.prototype.getPollInterval = function () {
        switch (this.status) {
            case MessagesEventBusStatus.Ready: {
                var requested = Array.from(this.requestedPollIntervals.values());
                var lowest = Math.min.apply(Math, __spreadArray([DEFAULT_POLL_INTERVAL], requested, false));
                return lowest;
            }
            case MessagesEventBusStatus.Backgrounded: {
                return BACKGROUND_POLL_INTERVAL;
            }
            default:
                return DEFAULT_POLL_INTERVAL;
        }
    };
    MessagesEventBus.prototype.resetPoll = function () {
        this.pollInterval = this.getPollInterval();
        this.stopPoll();
        this.startPoll();
    };
    MessagesEventBus.prototype.startPoll = function () {
        var _this = this;
        if (!this.isPolling)
            this.poll();
        this.pollIntervalRef = setInterval(function () {
            if (_this.isPolling)
                return;
            _this.poll();
        }, this.pollInterval);
    };
    MessagesEventBus.prototype.stopPoll = function () {
        if (this.pollIntervalRef)
            clearInterval(this.pollIntervalRef);
    };
    MessagesEventBus.prototype.poll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, events, needsEmit, batch, _i, events_1, ev, e_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isPolling)
                            return [2 /*return*/];
                        this.isPolling = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, networkRetry(2, function () {
                                return _this.agent.chat.bsky.convo.getLog({
                                    cursor: _this.latestRev,
                                }, { headers: DM_SERVICE_HEADERS });
                            })
                            // throw new Error('UNCOMMENT TO TEST POLL FAILURE')
                        ];
                    case 2:
                        response = _a.sent();
                        events = response.data.logs;
                        needsEmit = false;
                        batch = [];
                        for (_i = 0, events_1 = events; _i < events_1.length; _i++) {
                            ev = events_1[_i];
                            /*
                             * If there's a rev, we should handle it. If there's not a rev, we don't
                             * know what it is.
                             */
                            if ('rev' in ev && typeof ev.rev === 'string') {
                                /*
                                 * We only care about new events
                                 */
                                if (ev.rev > (this.latestRev = this.latestRev || ev.rev)) {
                                    /*
                                     * Update rev regardless of if it's a ev type we care about or not
                                     */
                                    this.latestRev = ev.rev;
                                    needsEmit = true;
                                    batch.push(ev);
                                }
                            }
                        }
                        if (needsEmit) {
                            this.emitter.emit('event', { type: 'logs', logs: batch });
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        e_2 = _a.sent();
                        if (!isNetworkError(e_2) && !isErrorMaybeAppPasswordPermissions(e_2)) {
                            logger.error("poll events failed", {
                                safeMessage: e_2.message,
                            });
                        }
                        this.dispatch({
                            event: MessagesEventBusDispatchEvent.Error,
                            payload: {
                                exception: e_2,
                                code: MessagesEventBusErrorCode.PollFailed,
                                retry: function () {
                                    _this.dispatch({ event: MessagesEventBusDispatchEvent.Resume });
                                },
                            },
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        this.isPolling = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return MessagesEventBus;
}());
export { MessagesEventBus };
