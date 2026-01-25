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
import { MetricsClient } from './client';
var appStateCallback;
jest.mock('#/lib/appState', function () { return ({
    onAppStateChange: jest.fn(function (cb) {
        appStateCallback = cb;
        return { remove: jest.fn() };
    }),
}); });
jest.mock('#/logger', function () { return ({
    Logger: {
        create: function () { return ({
            info: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
        }); },
        Context: { Metric: 'metric' },
    },
}); });
jest.mock('#/env', function () { return ({
    METRICS_API_HOST: 'https://test.metrics.api',
    IS_WEB: false,
}); });
describe('MetricsClient', function () {
    var fetchMock;
    var fetchRequests;
    beforeEach(function () {
        jest.useFakeTimers({ advanceTimers: true });
        fetchRequests = [];
        fetchMock = jest.fn().mockImplementation(function (_url, options) { return __awaiter(void 0, void 0, void 0, function () {
            var body;
            return __generator(this, function (_a) {
                body = JSON.parse(options.body);
                fetchRequests.push({ body: body });
                return [2 /*return*/, { ok: true, status: 200 }];
            });
        }); });
        global.fetch = fetchMock;
    });
    afterEach(function () {
        jest.useRealTimers();
        jest.clearAllMocks();
    });
    it('flushes events on interval', function () { return __awaiter(void 0, void 0, void 0, function () {
        var client;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = new MetricsClient();
                    client.track('click', { button: 'submit' });
                    client.track('view', { screen: 'home' });
                    expect(fetchRequests).toHaveLength(0);
                    // Advance past the 10 second interval
                    return [4 /*yield*/, jest.advanceTimersByTimeAsync(10000)];
                case 1:
                    // Advance past the 10 second interval
                    _a.sent();
                    expect(fetchRequests).toHaveLength(1);
                    expect(fetchRequests[0].body.events).toHaveLength(2);
                    expect(fetchRequests[0].body.events[0].event).toBe('click');
                    expect(fetchRequests[0].body.events[1].event).toBe('view');
                    return [2 /*return*/];
            }
        });
    }); });
    it('flushes when maxBatchSize is exceeded', function () { return __awaiter(void 0, void 0, void 0, function () {
        var client, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = new MetricsClient();
                    client.maxBatchSize = 5;
                    // Add events up to maxBatchSize (should not flush yet)
                    for (i = 0; i < 5; i++) {
                        client.track('click', { button: "btn-".concat(i) });
                    }
                    expect(fetchRequests).toHaveLength(0);
                    // One more event should trigger flush (> maxBatchSize)
                    client.track('click', { button: 'btn-trigger' });
                    // Allow microtasks to run
                    return [4 /*yield*/, jest.advanceTimersByTimeAsync(0)];
                case 1:
                    // Allow microtasks to run
                    _a.sent();
                    expect(fetchRequests).toHaveLength(1);
                    expect(fetchRequests[0].body.events).toHaveLength(6);
                    return [2 /*return*/];
            }
        });
    }); });
    it('retries failed events once on 500 response', function () { return __awaiter(void 0, void 0, void 0, function () {
        var requestCount, client;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requestCount = 0;
                    fetchMock.mockImplementation(function (_url, options) { return __awaiter(void 0, void 0, void 0, function () {
                        var body;
                        return __generator(this, function (_a) {
                            requestCount++;
                            body = JSON.parse(options.body);
                            if (requestCount === 1) {
                                // First request fails with 500 - "Failed to fetch" triggers isNetworkError
                                return [2 /*return*/, {
                                        ok: false,
                                        status: 500,
                                        text: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                            return [2 /*return*/, 'Internal Server Error'];
                                        }); }); },
                                    }];
                            }
                            // Retry succeeds
                            fetchRequests.push({ body: body });
                            return [2 /*return*/, { ok: true, status: 200 }];
                        });
                    }); });
                    client = new MetricsClient();
                    client.track('click', { button: 'submit' });
                    // Trigger flush via interval
                    return [4 /*yield*/, jest.advanceTimersByTimeAsync(10000)];
                case 1:
                    // Trigger flush via interval
                    _a.sent();
                    expect(requestCount).toBe(1);
                    expect(fetchRequests).toHaveLength(0);
                    // Simulate app coming to foreground to trigger retry
                    appStateCallback('active');
                    return [4 /*yield*/, jest.advanceTimersByTimeAsync(0)];
                case 2:
                    _a.sent();
                    expect(requestCount).toBe(2);
                    expect(fetchRequests).toHaveLength(1);
                    expect(fetchRequests[0].body.events).toHaveLength(1);
                    expect(fetchRequests[0].body.events[0].event).toBe('click');
                    return [2 /*return*/];
            }
        });
    }); });
    it('does not retry more than once', function () { return __awaiter(void 0, void 0, void 0, function () {
        var requestCount, client;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requestCount = 0;
                    fetchMock.mockImplementation(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            requestCount++;
                            // Always fail with network-like error
                            return [2 /*return*/, {
                                    ok: false,
                                    status: 500,
                                    text: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                        return [2 /*return*/, 'Internal Server Error'];
                                    }); }); },
                                }];
                        });
                    }); });
                    client = new MetricsClient();
                    client.track('click', { button: 'submit' });
                    // First flush fails
                    return [4 /*yield*/, jest.advanceTimersByTimeAsync(10000)];
                case 1:
                    // First flush fails
                    _a.sent();
                    expect(requestCount).toBe(1);
                    // Retry also fails
                    appStateCallback('active');
                    return [4 /*yield*/, jest.advanceTimersByTimeAsync(0)];
                case 2:
                    _a.sent();
                    expect(requestCount).toBe(2);
                    // Another foreground event should not retry again (events are dropped)
                    appStateCallback('active');
                    return [4 /*yield*/, jest.advanceTimersByTimeAsync(0)];
                case 3:
                    _a.sent();
                    expect(requestCount).toBe(2); // No additional requests
                    return [2 /*return*/];
            }
        });
    }); });
    it('flushes when app goes to background', function () { return __awaiter(void 0, void 0, void 0, function () {
        var client;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = new MetricsClient();
                    client.track('click', { button: 'submit' });
                    expect(fetchRequests).toHaveLength(0);
                    // Simulate app going to background
                    appStateCallback('background');
                    return [4 /*yield*/, jest.advanceTimersByTimeAsync(0)];
                case 1:
                    _a.sent();
                    expect(fetchRequests).toHaveLength(1);
                    return [2 /*return*/];
            }
        });
    }); });
});
