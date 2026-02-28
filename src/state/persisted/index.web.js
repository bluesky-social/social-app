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
import EventEmitter from 'eventemitter3';
import BroadcastChannel from '#/lib/broadcast';
import { logger } from '#/logger';
import { defaults, tryParse, tryStringify, } from '#/state/persisted/schema';
import { normalizeData } from './util';
export { defaults } from '#/state/persisted/schema';
var BSKY_STORAGE = 'BSKY_STORAGE';
var broadcast = new BroadcastChannel('BSKY_BROADCAST_CHANNEL');
var UPDATE_EVENT = 'BSKY_UPDATE';
var _state = defaults;
var _emitter = new EventEmitter();
// async, to match native implementation
// eslint-disable-next-line @typescript-eslint/require-await
export function init() {
    return __awaiter(this, void 0, void 0, function () {
        var stored;
        return __generator(this, function (_a) {
            broadcast.onmessage = onBroadcastMessage;
            window.onstorage = onStorage;
            stored = readFromStorage();
            if (stored) {
                _state = stored;
            }
            return [2 /*return*/];
        });
    });
}
init;
export function get(key) {
    return _state[key];
}
get;
// eslint-disable-next-line @typescript-eslint/require-await
export function write(key, value) {
    return __awaiter(this, void 0, void 0, function () {
        var next;
        var _a;
        return __generator(this, function (_b) {
            next = readFromStorage();
            if (next) {
                // The storage could have been updated by a different tab before this tab is notified.
                // Make sure this write is applied on top of the latest data in the storage as long as it's valid.
                _state = next;
                // Don't fire the update listeners yet to avoid a loop.
                // If there was a change, we'll receive the broadcast event soon enough which will do that.
            }
            try {
                if (JSON.stringify({ v: _state[key] }) === JSON.stringify({ v: value })) {
                    // Fast path for updates that are guaranteed to be noops.
                    // This is good mostly because it avoids useless broadcasts to other tabs.
                    return [2 /*return*/];
                }
            }
            catch (e) {
                // Ignore and go through the normal path.
            }
            _state = normalizeData(__assign(__assign({}, _state), (_a = {}, _a[key] = value, _a)));
            writeToStorage(_state);
            broadcast.postMessage({ event: { type: UPDATE_EVENT, key: key } });
            broadcast.postMessage({ event: UPDATE_EVENT }); // Backcompat while upgrading
            return [2 /*return*/];
        });
    });
}
write;
export function onUpdate(key, cb) {
    var listener = function () { return cb(get(key)); };
    _emitter.addListener('update', listener); // Backcompat while upgrading
    _emitter.addListener('update:' + key, listener);
    return function () {
        _emitter.removeListener('update', listener); // Backcompat while upgrading
        _emitter.removeListener('update:' + key, listener);
    };
}
onUpdate;
// eslint-disable-next-line @typescript-eslint/require-await
export function clearStorage() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                localStorage.removeItem(BSKY_STORAGE);
            }
            catch (e) {
                // Expected on the web in private mode.
            }
            return [2 /*return*/];
        });
    });
}
clearStorage;
function onStorage() {
    var next = readFromStorage();
    if (next === _state) {
        return;
    }
    if (next) {
        _state = next;
        _emitter.emit('update');
    }
}
// eslint-disable-next-line @typescript-eslint/require-await
function onBroadcastMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var next;
        var _c;
        var data = _b.data;
        return __generator(this, function (_d) {
            if (typeof data === 'object' &&
                (data.event === UPDATE_EVENT || // Backcompat while upgrading
                    ((_c = data.event) === null || _c === void 0 ? void 0 : _c.type) === UPDATE_EVENT)) {
                next = readFromStorage();
                if (next === _state) {
                    return [2 /*return*/];
                }
                if (next) {
                    _state = next;
                    if (typeof data.event.key === 'string') {
                        _emitter.emit('update:' + data.event.key);
                    }
                    else {
                        _emitter.emit('update'); // Backcompat while upgrading
                    }
                }
                else {
                    logger.error("persisted state: handled update update from broadcast channel, but found no data");
                }
            }
            return [2 /*return*/];
        });
    });
}
function writeToStorage(value) {
    var rawData = tryStringify(value);
    if (rawData) {
        try {
            localStorage.setItem(BSKY_STORAGE, rawData);
        }
        catch (e) {
            // Expected on the web in private mode.
        }
    }
}
var lastRawData;
var lastResult;
function readFromStorage() {
    var rawData = null;
    try {
        rawData = localStorage.getItem(BSKY_STORAGE);
    }
    catch (e) {
        // Expected on the web in private mode.
    }
    if (rawData) {
        if (rawData === lastRawData) {
            return lastResult;
        }
        else {
            var result = tryParse(rawData);
            if (result) {
                lastRawData = rawData;
                lastResult = normalizeData(result);
                return lastResult;
            }
        }
    }
}
