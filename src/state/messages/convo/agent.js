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
import { ChatBskyConvoDefs, } from '@atproto/api';
import { XRPCError } from '@atproto/xrpc';
import EventEmitter from 'eventemitter3';
import { nanoid } from 'nanoid/non-secure';
import { networkRetry } from '#/lib/async/retry';
import { DM_SERVICE_HEADERS } from '#/lib/constants';
import { isErrorMaybeAppPasswordPermissions, isNetworkError, } from '#/lib/strings/errors';
import { Logger } from '#/logger';
import { ACTIVE_POLL_INTERVAL, BACKGROUND_POLL_INTERVAL, INACTIVE_TIMEOUT, NETWORK_FAILURE_STATUSES, } from '#/state/messages/convo/const';
import { ConvoDispatchEvent, ConvoErrorCode, ConvoItemError, ConvoStatus, } from '#/state/messages/convo/types';
import { IS_NATIVE } from '#/env';
var logger = Logger.create(Logger.Context.ConversationAgent);
export function isConvoItemMessage(item) {
    if (!item)
        return false;
    return (item.type === 'message' ||
        item.type === 'deleted-message' ||
        item.type === 'pending-message');
}
var Convo = /** @class */ (function () {
    function Convo(params) {
        this.status = ConvoStatus.Uninitialized;
        this.oldestRev = undefined;
        this.isFetchingHistory = false;
        this.latestRev = undefined;
        this.pastMessages = new Map();
        this.newMessages = new Map();
        this.pendingMessages = new Map();
        this.deletedMessages = new Set();
        this.isProcessingPendingMessages = false;
        this.emitter = new EventEmitter();
        this.subscribers = [];
        this.pendingMessageFailure = null;
        this.id = nanoid(3);
        this.convoId = params.convoId;
        this.agent = params.agent;
        this.events = params.events;
        this.senderUserDid = params.agent.assertDid;
        if (params.placeholderData) {
            this.setupPlaceholderData(params.placeholderData);
        }
        this.subscribe = this.subscribe.bind(this);
        this.getSnapshot = this.getSnapshot.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.deleteMessage = this.deleteMessage.bind(this);
        this.fetchMessageHistory = this.fetchMessageHistory.bind(this);
        this.ingestFirehose = this.ingestFirehose.bind(this);
        this.onFirehoseConnect = this.onFirehoseConnect.bind(this);
        this.onFirehoseError = this.onFirehoseError.bind(this);
        this.markConvoAccepted = this.markConvoAccepted.bind(this);
        this.addReaction = this.addReaction.bind(this);
        this.removeReaction = this.removeReaction.bind(this);
    }
    Convo.prototype.commit = function () {
        this.snapshot = undefined;
        this.subscribers.forEach(function (subscriber) { return subscriber(); });
    };
    Convo.prototype.subscribe = function (subscriber) {
        var _this = this;
        if (this.subscribers.length === 0)
            this.init();
        this.subscribers.push(subscriber);
        return function () {
            _this.subscribers = _this.subscribers.filter(function (s) { return s !== subscriber; });
            if (_this.subscribers.length === 0)
                _this.suspend();
        };
    };
    Convo.prototype.getSnapshot = function () {
        if (!this.snapshot)
            this.snapshot = this.generateSnapshot();
        // logger.debug('snapshotted', {})
        return this.snapshot;
    };
    Convo.prototype.generateSnapshot = function () {
        switch (this.status) {
            case ConvoStatus.Initializing: {
                return {
                    status: ConvoStatus.Initializing,
                    items: [],
                    convo: this.convo,
                    error: undefined,
                    sender: this.sender,
                    recipients: this.recipients,
                    isFetchingHistory: this.isFetchingHistory,
                    deleteMessage: undefined,
                    sendMessage: undefined,
                    fetchMessageHistory: undefined,
                    markConvoAccepted: undefined,
                    addReaction: undefined,
                    removeReaction: undefined,
                };
            }
            case ConvoStatus.Disabled:
            case ConvoStatus.Suspended:
            case ConvoStatus.Backgrounded:
            case ConvoStatus.Ready: {
                return {
                    status: this.status,
                    items: this.getItems(),
                    convo: this.convo,
                    error: undefined,
                    sender: this.sender,
                    recipients: this.recipients,
                    isFetchingHistory: this.isFetchingHistory,
                    deleteMessage: this.deleteMessage,
                    sendMessage: this.sendMessage,
                    fetchMessageHistory: this.fetchMessageHistory,
                    markConvoAccepted: this.markConvoAccepted,
                    addReaction: this.addReaction,
                    removeReaction: this.removeReaction,
                };
            }
            case ConvoStatus.Error: {
                return {
                    status: ConvoStatus.Error,
                    items: [],
                    convo: undefined,
                    error: this.error,
                    sender: undefined,
                    recipients: undefined,
                    isFetchingHistory: false,
                    deleteMessage: undefined,
                    sendMessage: undefined,
                    fetchMessageHistory: undefined,
                    markConvoAccepted: undefined,
                    addReaction: undefined,
                    removeReaction: undefined,
                };
            }
            default: {
                return {
                    status: ConvoStatus.Uninitialized,
                    items: [],
                    convo: this.convo,
                    error: undefined,
                    sender: this.sender,
                    recipients: this.recipients,
                    isFetchingHistory: false,
                    deleteMessage: undefined,
                    sendMessage: undefined,
                    fetchMessageHistory: undefined,
                    markConvoAccepted: undefined,
                    addReaction: undefined,
                    removeReaction: undefined,
                };
            }
        }
    };
    Convo.prototype.dispatch = function (action) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        var prevStatus = this.status;
        switch (this.status) {
            case ConvoStatus.Uninitialized: {
                switch (action.event) {
                    case ConvoDispatchEvent.Init: {
                        this.status = ConvoStatus.Initializing;
                        this.setup();
                        this.setupFirehose();
                        this.requestPollInterval(ACTIVE_POLL_INTERVAL);
                        break;
                    }
                }
                break;
            }
            case ConvoStatus.Initializing: {
                switch (action.event) {
                    case ConvoDispatchEvent.Ready: {
                        this.status = ConvoStatus.Ready;
                        this.fetchMessageHistory();
                        break;
                    }
                    case ConvoDispatchEvent.Background: {
                        this.status = ConvoStatus.Backgrounded;
                        this.fetchMessageHistory();
                        this.requestPollInterval(BACKGROUND_POLL_INTERVAL);
                        break;
                    }
                    case ConvoDispatchEvent.Suspend: {
                        this.status = ConvoStatus.Suspended;
                        (_a = this.cleanupFirehoseConnection) === null || _a === void 0 ? void 0 : _a.call(this);
                        this.withdrawRequestedPollInterval();
                        break;
                    }
                    case ConvoDispatchEvent.Error: {
                        this.status = ConvoStatus.Error;
                        this.error = action.payload;
                        (_b = this.cleanupFirehoseConnection) === null || _b === void 0 ? void 0 : _b.call(this);
                        this.withdrawRequestedPollInterval();
                        break;
                    }
                    case ConvoDispatchEvent.Disable: {
                        this.status = ConvoStatus.Disabled;
                        this.fetchMessageHistory(); // finish init
                        (_c = this.cleanupFirehoseConnection) === null || _c === void 0 ? void 0 : _c.call(this);
                        this.withdrawRequestedPollInterval();
                        break;
                    }
                }
                break;
            }
            case ConvoStatus.Ready: {
                switch (action.event) {
                    case ConvoDispatchEvent.Resume: {
                        this.refreshConvo();
                        this.requestPollInterval(ACTIVE_POLL_INTERVAL);
                        break;
                    }
                    case ConvoDispatchEvent.Background: {
                        this.status = ConvoStatus.Backgrounded;
                        this.requestPollInterval(BACKGROUND_POLL_INTERVAL);
                        break;
                    }
                    case ConvoDispatchEvent.Suspend: {
                        this.status = ConvoStatus.Suspended;
                        (_d = this.cleanupFirehoseConnection) === null || _d === void 0 ? void 0 : _d.call(this);
                        this.withdrawRequestedPollInterval();
                        break;
                    }
                    case ConvoDispatchEvent.Error: {
                        this.status = ConvoStatus.Error;
                        this.error = action.payload;
                        (_e = this.cleanupFirehoseConnection) === null || _e === void 0 ? void 0 : _e.call(this);
                        this.withdrawRequestedPollInterval();
                        break;
                    }
                    case ConvoDispatchEvent.Disable: {
                        this.status = ConvoStatus.Disabled;
                        (_f = this.cleanupFirehoseConnection) === null || _f === void 0 ? void 0 : _f.call(this);
                        this.withdrawRequestedPollInterval();
                        break;
                    }
                }
                break;
            }
            case ConvoStatus.Backgrounded: {
                switch (action.event) {
                    case ConvoDispatchEvent.Resume: {
                        if (this.wasChatInactive()) {
                            this.reset();
                        }
                        else {
                            if (this.convo) {
                                this.status = ConvoStatus.Ready;
                                this.refreshConvo();
                                this.maybeRecoverFromNetworkError();
                            }
                            else {
                                this.status = ConvoStatus.Initializing;
                                this.setup();
                            }
                            this.requestPollInterval(ACTIVE_POLL_INTERVAL);
                        }
                        break;
                    }
                    case ConvoDispatchEvent.Suspend: {
                        this.status = ConvoStatus.Suspended;
                        (_g = this.cleanupFirehoseConnection) === null || _g === void 0 ? void 0 : _g.call(this);
                        this.withdrawRequestedPollInterval();
                        break;
                    }
                    case ConvoDispatchEvent.Error: {
                        this.status = ConvoStatus.Error;
                        this.error = action.payload;
                        (_h = this.cleanupFirehoseConnection) === null || _h === void 0 ? void 0 : _h.call(this);
                        this.withdrawRequestedPollInterval();
                        break;
                    }
                    case ConvoDispatchEvent.Disable: {
                        this.status = ConvoStatus.Disabled;
                        (_j = this.cleanupFirehoseConnection) === null || _j === void 0 ? void 0 : _j.call(this);
                        this.withdrawRequestedPollInterval();
                        break;
                    }
                }
                break;
            }
            case ConvoStatus.Suspended: {
                switch (action.event) {
                    case ConvoDispatchEvent.Init: {
                        this.reset();
                        break;
                    }
                    case ConvoDispatchEvent.Resume: {
                        this.reset();
                        break;
                    }
                    case ConvoDispatchEvent.Error: {
                        this.status = ConvoStatus.Error;
                        this.error = action.payload;
                        break;
                    }
                    case ConvoDispatchEvent.Disable: {
                        this.status = ConvoStatus.Disabled;
                        break;
                    }
                }
                break;
            }
            case ConvoStatus.Error: {
                switch (action.event) {
                    case ConvoDispatchEvent.Init: {
                        this.reset();
                        break;
                    }
                    case ConvoDispatchEvent.Resume: {
                        this.reset();
                        break;
                    }
                    case ConvoDispatchEvent.Suspend: {
                        this.status = ConvoStatus.Suspended;
                        break;
                    }
                    case ConvoDispatchEvent.Error: {
                        this.status = ConvoStatus.Error;
                        this.error = action.payload;
                        break;
                    }
                    case ConvoDispatchEvent.Disable: {
                        this.status = ConvoStatus.Disabled;
                        break;
                    }
                }
                break;
            }
            case ConvoStatus.Disabled: {
                // can't do anything
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
        this.updateLastActiveTimestamp();
        this.commit();
    };
    Convo.prototype.reset = function () {
        this.convo = undefined;
        this.sender = undefined;
        this.recipients = undefined;
        this.snapshot = undefined;
        this.status = ConvoStatus.Uninitialized;
        this.error = undefined;
        this.oldestRev = undefined;
        this.latestRev = undefined;
        this.pastMessages = new Map();
        this.newMessages = new Map();
        this.pendingMessages = new Map();
        this.deletedMessages = new Set();
        this.pendingMessageFailure = null;
        this.fetchMessageHistoryError = undefined;
        this.firehoseError = undefined;
        this.dispatch({ event: ConvoDispatchEvent.Init });
    };
    Convo.prototype.maybeRecoverFromNetworkError = function () {
        if (this.firehoseError) {
            this.firehoseError.retry();
            this.firehoseError = undefined;
            this.commit();
        }
        else {
            this.batchRetryPendingMessages();
        }
        if (this.fetchMessageHistoryError) {
            this.fetchMessageHistoryError.retry();
            this.fetchMessageHistoryError = undefined;
            this.commit();
        }
    };
    /**
     * Initialises the convo with placeholder data, if provided. We still refetch it before rendering the convo,
     * but this allows us to render the convo header immediately.
     */
    Convo.prototype.setupPlaceholderData = function (data) {
        var _this = this;
        this.convo = data.convo;
        this.sender = data.convo.members.find(function (m) { return m.did === _this.senderUserDid; });
        this.recipients = data.convo.members.filter(function (m) { return m.did !== _this.senderUserDid; });
    };
    Convo.prototype.setup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, convo, sender, recipients, userIsDisabled, e_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchConvo()];
                    case 1:
                        _a = _b.sent(), convo = _a.convo, sender = _a.sender, recipients = _a.recipients;
                        this.convo = convo;
                        this.sender = sender;
                        this.recipients = recipients;
                        /*
                         * Some validation prior to `Ready` status
                         */
                        if (!this.convo) {
                            throw new Error('could not find convo');
                        }
                        if (!this.sender) {
                            throw new Error('could not find sender in convo');
                        }
                        if (!this.recipients) {
                            throw new Error('could not find recipients in convo');
                        }
                        userIsDisabled = Boolean(this.sender.chatDisabled);
                        if (userIsDisabled) {
                            this.dispatch({ event: ConvoDispatchEvent.Disable });
                        }
                        else {
                            this.dispatch({ event: ConvoDispatchEvent.Ready });
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _b.sent();
                        if (!isNetworkError(e_1) && !isErrorMaybeAppPasswordPermissions(e_1)) {
                            logger.error('setup failed', {
                                safeMessage: e_1.message,
                            });
                        }
                        this.dispatch({
                            event: ConvoDispatchEvent.Error,
                            payload: {
                                exception: e_1,
                                code: ConvoErrorCode.InitFailed,
                                retry: function () {
                                    _this.reset();
                                },
                            },
                        });
                        this.commit();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Convo.prototype.init = function () {
        this.dispatch({ event: ConvoDispatchEvent.Init });
    };
    Convo.prototype.resume = function () {
        this.dispatch({ event: ConvoDispatchEvent.Resume });
    };
    Convo.prototype.background = function () {
        this.dispatch({ event: ConvoDispatchEvent.Background });
    };
    Convo.prototype.suspend = function () {
        this.dispatch({ event: ConvoDispatchEvent.Suspend });
    };
    /**
     * Called on any state transition, like when the chat is backgrounded. This
     * value is then checked on background -> foreground transitions.
     */
    Convo.prototype.updateLastActiveTimestamp = function () {
        this.lastActiveTimestamp = Date.now();
    };
    Convo.prototype.wasChatInactive = function () {
        if (!this.lastActiveTimestamp)
            return true;
        return Date.now() - this.lastActiveTimestamp > INACTIVE_TIMEOUT;
    };
    Convo.prototype.requestPollInterval = function (interval) {
        this.withdrawRequestedPollInterval();
        this.requestedPollInterval = this.events.requestPollInterval(interval);
    };
    Convo.prototype.withdrawRequestedPollInterval = function () {
        if (this.requestedPollInterval) {
            this.requestedPollInterval();
        }
    };
    Convo.prototype.fetchConvo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.pendingFetchConvo)
                    return [2 /*return*/, this.pendingFetchConvo];
                this.pendingFetchConvo = new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var response, convo, e_2;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, 3, 4]);
                                return [4 /*yield*/, networkRetry(2, function () {
                                        return _this.agent.api.chat.bsky.convo.getConvo({
                                            convoId: _this.convoId,
                                        }, { headers: DM_SERVICE_HEADERS });
                                    })];
                            case 1:
                                response = _a.sent();
                                convo = response.data.convo;
                                resolve({
                                    convo: convo,
                                    sender: convo.members.find(function (m) { return m.did === _this.senderUserDid; }),
                                    recipients: convo.members.filter(function (m) { return m.did !== _this.senderUserDid; }),
                                });
                                return [3 /*break*/, 4];
                            case 2:
                                e_2 = _a.sent();
                                reject(e_2);
                                return [3 /*break*/, 4];
                            case 3:
                                this.pendingFetchConvo = undefined;
                                return [7 /*endfinally*/];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/, this.pendingFetchConvo];
            });
        });
    };
    Convo.prototype.refreshConvo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, convo, sender, recipients, e_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchConvo()
                            // throw new Error('UNCOMMENT TO TEST REFRESH FAILURE')
                        ];
                    case 1:
                        _a = _b.sent(), convo = _a.convo, sender = _a.sender, recipients = _a.recipients;
                        // throw new Error('UNCOMMENT TO TEST REFRESH FAILURE')
                        this.convo = convo || this.convo;
                        this.sender = sender || this.sender;
                        this.recipients = recipients || this.recipients;
                        return [3 /*break*/, 3];
                    case 2:
                        e_3 = _b.sent();
                        if (!isNetworkError(e_3) && !isErrorMaybeAppPasswordPermissions(e_3)) {
                            logger.error("failed to refresh convo", {
                                safeMessage: e_3.message,
                            });
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Convo.prototype.fetchMessageHistory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var nextCursor_1, response, _a, cursor, messages, _i, messages_1, message, e_4;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logger.debug('fetch message history', {});
                        /*
                         * If oldestRev is null, we've fetched all history.
                         */
                        if (this.oldestRev === null)
                            return [2 /*return*/];
                        /*
                         * Don't fetch again if a fetch is already in progress
                         */
                        if (this.isFetchingHistory)
                            return [2 /*return*/];
                        /*
                         * If we've rendered a retry state for history fetching, exit. Upon retry,
                         * this will be removed and we'll try again.
                         */
                        if (this.fetchMessageHistoryError)
                            return [2 /*return*/];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        this.isFetchingHistory = true;
                        this.commit();
                        nextCursor_1 = this.oldestRev // for TS
                        ;
                        return [4 /*yield*/, networkRetry(2, function () {
                                return _this.agent.api.chat.bsky.convo.getMessages({
                                    cursor: nextCursor_1,
                                    convoId: _this.convoId,
                                    limit: IS_NATIVE ? 30 : 60,
                                }, { headers: DM_SERVICE_HEADERS });
                            })];
                    case 2:
                        response = _b.sent();
                        _a = response.data, cursor = _a.cursor, messages = _a.messages;
                        this.oldestRev = cursor !== null && cursor !== void 0 ? cursor : null;
                        for (_i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
                            message = messages_1[_i];
                            if (ChatBskyConvoDefs.isMessageView(message) ||
                                ChatBskyConvoDefs.isDeletedMessageView(message)) {
                                /*
                                 * If this message is already in new messages, it was added by the
                                 * firehose ingestion, and we can safely overwrite it. This trusts
                                 * the server on ordering, and keeps it in sync.
                                 */
                                if (this.newMessages.has(message.id)) {
                                    this.newMessages.delete(message.id);
                                }
                                this.pastMessages.set(message.id, message);
                            }
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        e_4 = _b.sent();
                        if (!isNetworkError(e_4) && !isErrorMaybeAppPasswordPermissions(e_4)) {
                            logger.error('failed to fetch message history', {
                                safeMessage: e_4.message,
                            });
                        }
                        this.fetchMessageHistoryError = {
                            retry: function () {
                                _this.fetchMessageHistory();
                            },
                        };
                        return [3 /*break*/, 5];
                    case 4:
                        this.isFetchingHistory = false;
                        this.commit();
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Convo.prototype.setupFirehose = function () {
        var _this = this;
        var _a;
        // remove old listeners, if exist
        (_a = this.cleanupFirehoseConnection) === null || _a === void 0 ? void 0 : _a.call(this);
        // reconnect
        this.cleanupFirehoseConnection = this.events.on(function (event) {
            switch (event.type) {
                case 'connect': {
                    _this.onFirehoseConnect();
                    break;
                }
                case 'error': {
                    _this.onFirehoseError(event.error);
                    break;
                }
                case 'logs': {
                    _this.ingestFirehose(event.logs);
                    break;
                }
            }
        }, 
        /*
         * This is VERY important — we only want events for this convo.
         */
        { convoId: this.convoId });
    };
    Convo.prototype.onFirehoseConnect = function () {
        this.firehoseError = undefined;
        this.batchRetryPendingMessages();
        this.commit();
    };
    Convo.prototype.onFirehoseError = function (error) {
        this.firehoseError = error;
        this.commit();
    };
    Convo.prototype.ingestFirehose = function (events) {
        var needsCommit = false;
        for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
            var ev = events_1[_i];
            /*
             * If there's a rev, we should handle it. If there's not a rev, we don't
             * know what it is.
             */
            if ('rev' in ev && typeof ev.rev === 'string') {
                var isUninitialized = !this.latestRev;
                var isNewEvent = this.latestRev && ev.rev > this.latestRev;
                /*
                 * We received an event prior to fetching any history, so we can safely
                 * use this as the initial history cursor
                 */
                if (this.oldestRev === undefined && isUninitialized) {
                    this.oldestRev = ev.rev;
                }
                /*
                 * We only care about new events
                 */
                if (isNewEvent || isUninitialized) {
                    /*
                     * Update rev regardless of if it's a ev type we care about or not
                     */
                    this.latestRev = ev.rev;
                    if (ChatBskyConvoDefs.isLogCreateMessage(ev) &&
                        ChatBskyConvoDefs.isMessageView(ev.message)) {
                        /**
                         * If this message is already in new messages, it was added by our
                         * sending logic, and is based on client-ordering. When we receive
                         * the "commited" event from the log, we should replace this
                         * reference and re-insert in order to respect the order we receied
                         * from the log.
                         */
                        if (this.newMessages.has(ev.message.id)) {
                            this.newMessages.delete(ev.message.id);
                        }
                        this.newMessages.set(ev.message.id, ev.message);
                        needsCommit = true;
                    }
                    else if (ChatBskyConvoDefs.isLogDeleteMessage(ev) &&
                        ChatBskyConvoDefs.isDeletedMessageView(ev.message)) {
                        /*
                         * Update if we have this in state. If we don't, don't worry about it.
                         */
                        if (this.pastMessages.has(ev.message.id) ||
                            this.newMessages.has(ev.message.id)) {
                            this.pastMessages.delete(ev.message.id);
                            this.newMessages.delete(ev.message.id);
                            this.deletedMessages.delete(ev.message.id);
                            needsCommit = true;
                        }
                    }
                    else if ((ChatBskyConvoDefs.isLogAddReaction(ev) ||
                        ChatBskyConvoDefs.isLogRemoveReaction(ev)) &&
                        ChatBskyConvoDefs.isMessageView(ev.message)) {
                        /*
                         * Update if we have this in state - replace message wholesale. If we don't, don't worry about it.
                         */
                        if (this.pastMessages.has(ev.message.id)) {
                            this.pastMessages.set(ev.message.id, ev.message);
                            needsCommit = true;
                        }
                        if (this.newMessages.has(ev.message.id)) {
                            this.newMessages.set(ev.message.id, ev.message);
                            needsCommit = true;
                        }
                    }
                }
            }
        }
        if (needsCommit) {
            this.commit();
        }
    };
    Convo.prototype.sendMessage = function (message) {
        var _a;
        // Ignore empty messages for now since they have no other purpose atm
        if (!message.text.trim() && !message.embed)
            return;
        logger.debug('send message', {});
        var tempId = nanoid();
        this.pendingMessageFailure = null;
        this.pendingMessages.set(tempId, {
            id: tempId,
            message: message,
        });
        if (((_a = this.convo) === null || _a === void 0 ? void 0 : _a.status) === 'request') {
            this.convo = __assign(__assign({}, this.convo), { status: 'accepted' });
        }
        this.commit();
        if (!this.isProcessingPendingMessages && !this.pendingMessageFailure) {
            this.processPendingMessages();
        }
    };
    Convo.prototype.markConvoAccepted = function () {
        if (this.convo) {
            this.convo = __assign(__assign({}, this.convo), { status: 'accepted' });
        }
        this.commit();
    };
    Convo.prototype.processPendingMessages = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pendingMessage, id, message, response, res, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.debug("processing messages (".concat(this.pendingMessages.size, " remaining)"), {});
                        pendingMessage = Array.from(this.pendingMessages.values()).shift();
                        /*
                         * If there are no pending messages, we're done.
                         */
                        if (!pendingMessage) {
                            this.isProcessingPendingMessages = false;
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        this.isProcessingPendingMessages = true;
                        id = pendingMessage.id, message = pendingMessage.message;
                        return [4 /*yield*/, this.agent.api.chat.bsky.convo.sendMessage({
                                convoId: this.convoId,
                                message: message,
                            }, { encoding: 'application/json', headers: DM_SERVICE_HEADERS })];
                    case 2:
                        response = _a.sent();
                        res = response.data;
                        // remove from queue
                        this.pendingMessages.delete(id);
                        /*
                         * Insert into `newMessages` as soon as we have a real ID. That way, when
                         * we get an event log back, we can replace in situ.
                         */
                        this.newMessages.set(res.id, __assign(__assign({}, res), { $type: 'chat.bsky.convo.defs#messageView' }));
                        // render new message state, prior to firehose
                        this.commit();
                        // continue queue processing
                        return [4 /*yield*/, this.processPendingMessages()];
                    case 3:
                        // continue queue processing
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_5 = _a.sent();
                        this.handleSendMessageFailure(e_5);
                        this.isProcessingPendingMessages = false;
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Convo.prototype.handleSendMessageFailure = function (e) {
        if (e instanceof XRPCError) {
            if (NETWORK_FAILURE_STATUSES.includes(e.status)) {
                this.pendingMessageFailure = 'recoverable';
            }
            else {
                this.pendingMessageFailure = 'unrecoverable';
                switch (e.message) {
                    case 'block between recipient and sender':
                        this.emitter.emit('event', {
                            type: 'invalidate-block-state',
                            accountDids: __spreadArray([
                                this.sender.did
                            ], this.recipients.map(function (r) { return r.did; }), true),
                        });
                        break;
                    case 'Account is disabled':
                        this.dispatch({ event: ConvoDispatchEvent.Disable });
                        break;
                    case 'Convo not found':
                    case 'Account does not exist':
                    case 'recipient does not exist':
                    case 'recipient requires incoming messages to come from someone they follow':
                    case 'recipient has disabled incoming messages':
                        break;
                    default:
                        if (!isNetworkError(e)) {
                            logger.warn("handleSendMessageFailure could not handle error", {
                                status: e.status,
                                message: e.message,
                            });
                        }
                        break;
                }
            }
        }
        else {
            this.pendingMessageFailure = 'unrecoverable';
            if (!isNetworkError(e) && !isErrorMaybeAppPasswordPermissions(e)) {
                logger.error("handleSendMessageFailure received unknown error", {
                    safeMessage: e.message,
                });
            }
        }
        this.commit();
    };
    Convo.prototype.batchRetryPendingMessages = function () {
        return __awaiter(this, void 0, void 0, function () {
            var messageArray, data, items, _i, items_1, item, _a, messageArray_1, pendingMessage, e_6;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.pendingMessageFailure === null)
                            return [2 /*return*/];
                        messageArray = Array.from(this.pendingMessages.values());
                        if (messageArray.length === 0)
                            return [2 /*return*/];
                        this.pendingMessageFailure = null;
                        this.commit();
                        logger.debug("batch retrying ".concat(this.pendingMessages.size, " pending messages"), {});
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.agent.api.chat.bsky.convo.sendMessageBatch({
                                items: messageArray.map(function (_a) {
                                    var message = _a.message;
                                    return ({
                                        convoId: _this.convoId,
                                        message: message,
                                    });
                                }),
                            }, { encoding: 'application/json', headers: DM_SERVICE_HEADERS })];
                    case 2:
                        data = (_b.sent()).data;
                        items = data.items;
                        /*
                         * Insert into `newMessages` as soon as we have a real ID. That way, when
                         * we get an event log back, we can replace in situ.
                         */
                        for (_i = 0, items_1 = items; _i < items_1.length; _i++) {
                            item = items_1[_i];
                            this.newMessages.set(item.id, __assign(__assign({}, item), { $type: 'chat.bsky.convo.defs#messageView' }));
                        }
                        for (_a = 0, messageArray_1 = messageArray; _a < messageArray_1.length; _a++) {
                            pendingMessage = messageArray_1[_a];
                            this.pendingMessages.delete(pendingMessage.id);
                        }
                        this.commit();
                        logger.debug("sent ".concat(this.pendingMessages.size, " pending messages"), {});
                        return [3 /*break*/, 4];
                    case 3:
                        e_6 = _b.sent();
                        this.handleSendMessageFailure(e_6);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Convo.prototype.deleteMessage = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var e_7;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.debug('delete message', {});
                        this.deletedMessages.add(messageId);
                        this.commit();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, networkRetry(2, function () {
                                return _this.agent.api.chat.bsky.convo.deleteMessageForSelf({
                                    convoId: _this.convoId,
                                    messageId: messageId,
                                }, { encoding: 'application/json', headers: DM_SERVICE_HEADERS });
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_7 = _a.sent();
                        if (!isNetworkError(e_7) && !isErrorMaybeAppPasswordPermissions(e_7)) {
                            logger.error("failed to delete message", {
                                safeMessage: e_7.message,
                            });
                        }
                        this.deletedMessages.delete(messageId);
                        this.commit();
                        throw e_7;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Convo.prototype.on = function (handler) {
        var _this = this;
        this.emitter.on('event', handler);
        return function () {
            _this.emitter.off('event', handler);
        };
    };
    /*
     * Items in reverse order, since FlatList inverts
     */
    Convo.prototype.getItems = function () {
        var _this = this;
        var items = [];
        this.pastMessages.forEach(function (m) {
            if (ChatBskyConvoDefs.isMessageView(m)) {
                items.unshift({
                    type: 'message',
                    key: m.id,
                    message: m,
                    nextMessage: null,
                    prevMessage: null,
                });
            }
            else if (ChatBskyConvoDefs.isDeletedMessageView(m)) {
                items.unshift({
                    type: 'deleted-message',
                    key: m.id,
                    message: m,
                    nextMessage: null,
                    prevMessage: null,
                });
            }
        });
        if (this.fetchMessageHistoryError) {
            items.unshift({
                type: 'error',
                code: ConvoItemError.HistoryFailed,
                key: ConvoItemError.HistoryFailed,
                retry: function () {
                    _this.maybeRecoverFromNetworkError();
                },
            });
        }
        this.newMessages.forEach(function (m) {
            if (ChatBskyConvoDefs.isMessageView(m)) {
                items.push({
                    type: 'message',
                    key: m.id,
                    message: m,
                    nextMessage: null,
                    prevMessage: null,
                });
            }
            else if (ChatBskyConvoDefs.isDeletedMessageView(m)) {
                items.push({
                    type: 'deleted-message',
                    key: m.id,
                    message: m,
                    nextMessage: null,
                    prevMessage: null,
                });
            }
        });
        this.pendingMessages.forEach(function (m) {
            items.push({
                type: 'pending-message',
                key: m.id,
                message: __assign(__assign({}, m.message), { embed: undefined, $type: 'chat.bsky.convo.defs#messageView', id: nanoid(), rev: '__fake__', sentAt: new Date().toISOString(), 
                    /*
                     * `getItems` is only run in "active" status states, where
                     * `this.sender` is defined
                     */
                    sender: {
                        $type: 'chat.bsky.convo.defs#messageViewSender',
                        did: _this.sender.did,
                    } }),
                nextMessage: null,
                prevMessage: null,
                failed: _this.pendingMessageFailure !== null,
                retry: _this.pendingMessageFailure === 'recoverable'
                    ? function () {
                        _this.maybeRecoverFromNetworkError();
                    }
                    : undefined,
            });
        });
        if (this.firehoseError) {
            items.push({
                type: 'error',
                code: ConvoItemError.FirehoseFailed,
                key: ConvoItemError.FirehoseFailed,
                retry: function () {
                    var _a;
                    (_a = _this.firehoseError) === null || _a === void 0 ? void 0 : _a.retry();
                },
            });
        }
        return items
            .filter(function (item) {
            if (isConvoItemMessage(item)) {
                return !_this.deletedMessages.has(item.message.id);
            }
            return true;
        })
            .map(function (item, i, arr) {
            var nextMessage = null;
            var prevMessage = null;
            var isMessage = isConvoItemMessage(item);
            if (isMessage) {
                if (ChatBskyConvoDefs.isMessageView(item.message) ||
                    ChatBskyConvoDefs.isDeletedMessageView(item.message)) {
                    var next = arr[i + 1];
                    if (isConvoItemMessage(next) &&
                        (ChatBskyConvoDefs.isMessageView(next.message) ||
                            ChatBskyConvoDefs.isDeletedMessageView(next.message))) {
                        nextMessage = next.message;
                    }
                    var prev = arr[i - 1];
                    if (isConvoItemMessage(prev) &&
                        (ChatBskyConvoDefs.isMessageView(prev.message) ||
                            ChatBskyConvoDefs.isDeletedMessageView(prev.message))) {
                        prevMessage = prev.message;
                    }
                }
                return __assign(__assign({}, item), { nextMessage: nextMessage, prevMessage: prevMessage });
            }
            return item;
        });
    };
    /**
     * Add an emoji reaction to a message
     *
     * @param messageId - the id of the message to add the reaction to
     * @param emoji - must be one grapheme
     */
    Convo.prototype.addReaction = function (messageId, emoji) {
        return __awaiter(this, void 0, void 0, function () {
            var optimisticReaction, restore, prevMessage_1, prevMessage_2, data, error_1;
            var _this = this;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        optimisticReaction = {
                            value: emoji,
                            sender: { did: this.senderUserDid },
                            createdAt: new Date().toISOString(),
                        };
                        restore = null;
                        if (this.pastMessages.has(messageId)) {
                            prevMessage_1 = this.pastMessages.get(messageId);
                            if (ChatBskyConvoDefs.isMessageView(prevMessage_1) &&
                                // skip optimistic update if reaction already exists
                                !((_a = prevMessage_1.reactions) === null || _a === void 0 ? void 0 : _a.find(function (reaction) {
                                    return reaction.sender.did === _this.senderUserDid &&
                                        reaction.value === emoji;
                                }))) {
                                if (prevMessage_1.reactions) {
                                    if (prevMessage_1.reactions.filter(function (reaction) { return reaction.sender.did === _this.senderUserDid; }).length >= 5) {
                                        throw new Error('Maximum reactions reached');
                                    }
                                }
                                this.pastMessages.set(messageId, __assign(__assign({}, prevMessage_1), { reactions: __spreadArray(__spreadArray([], ((_b = prevMessage_1.reactions) !== null && _b !== void 0 ? _b : []), true), [optimisticReaction], false) }));
                                this.commit();
                                restore = function () {
                                    _this.pastMessages.set(messageId, prevMessage_1);
                                    _this.commit();
                                };
                            }
                        }
                        else if (this.newMessages.has(messageId)) {
                            prevMessage_2 = this.newMessages.get(messageId);
                            if (ChatBskyConvoDefs.isMessageView(prevMessage_2) &&
                                !((_c = prevMessage_2.reactions) === null || _c === void 0 ? void 0 : _c.find(function (reaction) { return reaction.value === emoji; }))) {
                                if (prevMessage_2.reactions && prevMessage_2.reactions.length >= 5)
                                    throw new Error('Maximum reactions reached');
                                this.newMessages.set(messageId, __assign(__assign({}, prevMessage_2), { reactions: __spreadArray(__spreadArray([], ((_d = prevMessage_2.reactions) !== null && _d !== void 0 ? _d : []), true), [optimisticReaction], false) }));
                                this.commit();
                                restore = function () {
                                    _this.newMessages.set(messageId, prevMessage_2);
                                    _this.commit();
                                };
                            }
                        }
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        logger.debug("Adding reaction ".concat(emoji, " to message ").concat(messageId));
                        return [4 /*yield*/, this.agent.chat.bsky.convo.addReaction({ messageId: messageId, value: emoji, convoId: this.convoId }, { encoding: 'application/json', headers: DM_SERVICE_HEADERS })];
                    case 2:
                        data = (_e.sent()).data;
                        if (ChatBskyConvoDefs.isMessageView(data.message)) {
                            if (this.pastMessages.has(messageId)) {
                                this.pastMessages.set(messageId, data.message);
                                this.commit();
                            }
                            else if (this.newMessages.has(messageId)) {
                                this.newMessages.set(messageId, data.message);
                                this.commit();
                            }
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _e.sent();
                        if (restore)
                            restore();
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /*
     * Remove a reaction from a message.
     *
     * @param messageId - The ID of the message to remove the reaction from.
     * @param emoji - The emoji to remove.
     */
    Convo.prototype.removeReaction = function (messageId, emoji) {
        return __awaiter(this, void 0, void 0, function () {
            var restore, prevMessage_3, prevMessage_4, error_2;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        restore = null;
                        if (this.pastMessages.has(messageId)) {
                            prevMessage_3 = this.pastMessages.get(messageId);
                            if (ChatBskyConvoDefs.isMessageView(prevMessage_3)) {
                                this.pastMessages.set(messageId, __assign(__assign({}, prevMessage_3), { reactions: (_a = prevMessage_3.reactions) === null || _a === void 0 ? void 0 : _a.filter(function (reaction) {
                                        return reaction.value !== emoji ||
                                            reaction.sender.did !== _this.senderUserDid;
                                    }) }));
                                this.commit();
                                restore = function () {
                                    _this.pastMessages.set(messageId, prevMessage_3);
                                    _this.commit();
                                };
                            }
                        }
                        else if (this.newMessages.has(messageId)) {
                            prevMessage_4 = this.newMessages.get(messageId);
                            if (ChatBskyConvoDefs.isMessageView(prevMessage_4)) {
                                this.newMessages.set(messageId, __assign(__assign({}, prevMessage_4), { reactions: (_b = prevMessage_4.reactions) === null || _b === void 0 ? void 0 : _b.filter(function (reaction) {
                                        return reaction.value !== emoji ||
                                            reaction.sender.did !== _this.senderUserDid;
                                    }) }));
                                this.commit();
                                restore = function () {
                                    _this.newMessages.set(messageId, prevMessage_4);
                                    _this.commit();
                                };
                            }
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        logger.debug("Removing reaction ".concat(emoji, " from message ").concat(messageId));
                        return [4 /*yield*/, this.agent.chat.bsky.convo.removeReaction({ messageId: messageId, value: emoji, convoId: this.convoId }, { encoding: 'application/json', headers: DM_SERVICE_HEADERS })];
                    case 2:
                        _c.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _c.sent();
                        if (restore)
                            restore();
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return Convo;
}());
export { Convo };
