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
import { onAppStateChange } from '#/lib/appState';
import { isNetworkError } from '#/lib/strings/errors';
import { Logger } from '#/logger';
import * as env from '#/env';
var TRACKING_ENDPOINT = env.METRICS_API_HOST + '/t';
var logger = Logger.create(Logger.Context.Metric, {});
var MetricsClient = /** @class */ (function () {
    function MetricsClient() {
        this.maxBatchSize = 100;
        this.started = false;
        this.queue = [];
        this.failedQueue = [];
        this.flushInterval = null;
    }
    MetricsClient.prototype.start = function () {
        var _this = this;
        if (this.started)
            return;
        this.started = true;
        this.flushInterval = setInterval(function () {
            _this.flush();
        }, 10000);
        onAppStateChange(function (state) {
            if (state === 'active') {
                _this.retryFailedLogs();
            }
            else {
                _this.flush();
            }
        });
    };
    MetricsClient.prototype.track = function (event, payload, metadata) {
        if (metadata === void 0) { metadata = {}; }
        this.start();
        var e = {
            time: Date.now(),
            event: event,
            payload: payload,
            metadata: metadata,
        };
        this.queue.push(e);
        logger.debug("event: ".concat(e.event), e);
        if (this.queue.length > this.maxBatchSize) {
            this.flush();
        }
    };
    MetricsClient.prototype.flush = function () {
        if (!this.queue.length)
            return;
        var events = this.queue.splice(0, this.queue.length);
        this.sendBatch(events);
    };
    MetricsClient.prototype.sendBatch = function (events_1) {
        return __awaiter(this, arguments, void 0, function (events, isRetry) {
            var body, success, res, error, e_1;
            var _a;
            if (isRetry === void 0) { isRetry = false; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logger.debug("sendBatch: ".concat(events.length), {
                            isRetry: isRetry,
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        body = JSON.stringify({ events: events });
                        if (!(env.IS_WEB && 'navigator' in globalThis && navigator.sendBeacon)) return [3 /*break*/, 2];
                        success = navigator.sendBeacon(TRACKING_ENDPOINT, new Blob([body], { type: 'application/json' }));
                        if (!success) {
                            // construct a "network error" for `isNetworkError` to work
                            throw new Error("Failed to fetch: sendBeacon returned false");
                        }
                        return [3 /*break*/, 5];
                    case 2: return [4 /*yield*/, fetch(TRACKING_ENDPOINT, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ events: events }),
                            keepalive: true,
                        })];
                    case 3:
                        res = _b.sent();
                        if (!!res.ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, res.text().catch(function () { return 'Unknown error'; })
                            // construct a "network error" for `isNetworkError` to work
                        ];
                    case 4:
                        error = _b.sent();
                        // construct a "network error" for `isNetworkError` to work
                        throw new Error("".concat(res.status, " Failed to fetch \u2014 ").concat(error));
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_1 = _b.sent();
                        if (isNetworkError(e_1)) {
                            if (isRetry)
                                return [2 /*return*/]; // retry once
                            (_a = this.failedQueue).push.apply(_a, events);
                            return [2 /*return*/];
                        }
                        logger.error("Failed to send metrics", {
                            safeMessage: e_1.toString(),
                        });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    MetricsClient.prototype.retryFailedLogs = function () {
        if (!this.failedQueue.length)
            return;
        var events = this.failedQueue.splice(0, this.failedQueue.length);
        this.sendBatch(events, true);
    };
    return MetricsClient;
}());
export { MetricsClient };
