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
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
jest.mock('@bsky.app/react-native-mmkv', function () { return ({
    MMKV: /** @class */ (function () {
        function MMKVMock() {
            this._store = new Map();
        }
        MMKVMock.prototype.getString = function (key) {
            return this._store.get(key);
        };
        MMKVMock.prototype.set = function (key, value) {
            this._store.set(key, value);
        };
        MMKVMock.prototype.delete = function (key) {
            this._store.delete(key);
        };
        MMKVMock.prototype.clearAll = function () {
            this._store.clear();
        };
        return MMKVMock;
    }()),
}); });
import { createPersistedQueryStorage } from '../persisted-query-storage';
describe('createPersistedQueryStorage', function () {
    it('should create isolated storage instances', function () { return __awaiter(void 0, void 0, void 0, function () {
        var storage1, storage2, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    storage1 = createPersistedQueryStorage('store1');
                    storage2 = createPersistedQueryStorage('store2');
                    return [4 /*yield*/, storage1.setItem('key', 'value1')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, storage2.setItem('key', 'value2')];
                case 2:
                    _c.sent();
                    _a = expect;
                    return [4 /*yield*/, storage1.getItem('key')];
                case 3:
                    _a.apply(void 0, [_c.sent()]).toBe('value1');
                    _b = expect;
                    return [4 /*yield*/, storage2.getItem('key')];
                case 4:
                    _b.apply(void 0, [_c.sent()]).toBe('value2');
                    return [2 /*return*/];
            }
        });
    }); });
    describe('storage operations', function () {
        var storage;
        beforeEach(function () {
            storage = createPersistedQueryStorage('test_store');
        });
        it('should return null for non-existent keys', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage.getItem('non-existent-key')];
                    case 1:
                        result = _a.sent();
                        expect(result).toBeNull();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should store and retrieve a value', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testValue, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testValue = JSON.stringify({ data: 'test' });
                        return [4 /*yield*/, storage.setItem('test-key', testValue)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, storage.getItem('test-key')];
                    case 2:
                        result = _a.sent();
                        expect(result).toBe(testValue);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should remove a value', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testValue, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testValue = JSON.stringify({ data: 'test' });
                        return [4 /*yield*/, storage.setItem('test-key', testValue)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, storage.removeItem('test-key')];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, storage.getItem('test-key')];
                    case 3:
                        result = _a.sent();
                        expect(result).toBeNull();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should handle complex JSON data', function () { return __awaiter(void 0, void 0, void 0, function () {
            var complexData, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        complexData = JSON.stringify({
                            queries: [
                                { key: 'query1', data: { nested: { value: 123 } } },
                                { key: 'query2', data: { array: [1, 2, 3] } },
                            ],
                            timestamp: Date.now(),
                        });
                        return [4 /*yield*/, storage.setItem('complex-key', complexData)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, storage.getItem('complex-key')];
                    case 2:
                        result = _a.sent();
                        expect(result).toBe(complexData);
                        expect(JSON.parse(result)).toEqual(JSON.parse(complexData));
                        return [2 /*return*/];
                }
            });
        }); });
        it('should overwrite existing values', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage.setItem('test-key', 'value1')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, storage.setItem('test-key', 'value2')];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, storage.getItem('test-key')];
                    case 3:
                        result = _a.sent();
                        expect(result).toBe('value2');
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
