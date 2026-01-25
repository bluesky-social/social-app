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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '#/logger';
import { defaults, tryParse, tryStringify, } from '#/state/persisted/schema';
import { device } from '#/storage';
import { normalizeData } from './util';
export { defaults } from '#/state/persisted/schema';
var BSKY_STORAGE = 'BSKY_STORAGE';
var _state = defaults;
export function init() {
    return __awaiter(this, void 0, void 0, function () {
        var stored;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readFromStorage()];
                case 1:
                    stored = _a.sent();
                    if (stored) {
                        _state = stored;
                    }
                    return [2 /*return*/];
            }
        });
    });
}
init;
export function get(key) {
    return _state[key];
}
get;
export function write(key, value) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _state = normalizeData(__assign(__assign({}, _state), (_a = {}, _a[key] = value, _a)));
                    return [4 /*yield*/, writeToStorage(_state)];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
write;
export function onUpdate(_key, _cb) {
    return function () { };
}
onUpdate;
export function clearStorage() {
    return __awaiter(this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, AsyncStorage.removeItem(BSKY_STORAGE)];
                case 1:
                    _a.sent();
                    device.removeAll();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    logger.error("persisted store: failed to clear", { message: e_1.toString() });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
clearStorage;
function writeToStorage(value) {
    return __awaiter(this, void 0, void 0, function () {
        var rawData, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rawData = tryStringify(value);
                    if (!rawData) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, AsyncStorage.setItem(BSKY_STORAGE, rawData)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_2 = _a.sent();
                    logger.error("persisted state: failed writing root state to storage", {
                        message: e_2,
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function readFromStorage() {
    return __awaiter(this, void 0, void 0, function () {
        var rawData, e_3, parsed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rawData = null;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, AsyncStorage.getItem(BSKY_STORAGE)];
                case 2:
                    rawData = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_3 = _a.sent();
                    logger.error("persisted state: failed reading root state from storage", {
                        message: e_3,
                    });
                    return [3 /*break*/, 4];
                case 4:
                    if (rawData) {
                        parsed = tryParse(rawData);
                        if (parsed) {
                            return [2 /*return*/, normalizeData(parsed)];
                        }
                    }
                    return [2 /*return*/];
            }
        });
    });
}
