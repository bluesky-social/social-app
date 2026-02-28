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
import { create } from '#/storage/archive/db';
export * from '#/storage/archive/schema';
/**
 * Generic archival storage class. DO NOT use this directly. Instead, use the
 * exported `Archive` instances below.
 */
var Archive = /** @class */ (function () {
    function Archive(_a) {
        var id = _a.id;
        this.sep = ':';
        this.store = create({ id: id });
    }
    /**
     * Store a value in archival storage based on scopes and/or keys
     *
     *   `set([key], value)`
     *   `set([scope, key], value)`
     */
    Archive.prototype.set = function (scopes, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // stored as `{ data: <value> }` structure to ease stringification
                return [2 /*return*/, this.store.set(scopes.join(this.sep), JSON.stringify({ data: data }))];
            });
        });
    };
    /**
     * Get a value from archival storage based on scopes and/or keys
     *
     *   `get([key])`
     *   `get([scope, key])`
     */
    Archive.prototype.get = function (scopes) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.store.get(scopes.join(this.sep))];
                    case 1:
                        res = _a.sent();
                        if (!res)
                            return [2 /*return*/, undefined
                                // parsed from storage structure `{ data: <value> }`
                            ];
                        // parsed from storage structure `{ data: <value> }`
                        return [2 /*return*/, JSON.parse(res).data];
                }
            });
        });
    };
    /**
     * Remove a value from archival storage based on scopes and/or keys
     *
     *   `remove([key])`
     *   `remove([scope, key])`
     */
    Archive.prototype.remove = function (scopes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.store.delete(scopes.join(this.sep))];
            });
        });
    };
    /**
     * Remove many values from the same archival storage scope by keys
     *
     *   `removeMany([], [key])`
     *   `removeMany([scope], [key])`
     */
    Archive.prototype.removeMany = function (scopes, keys) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(keys.map(function (key) { return _this.remove(__spreadArray(__spreadArray([], scopes, true), [key], false)); }))];
            });
        });
    };
    /**
     * For debugging purposes
     */
    Archive.prototype.removeAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.store.clear()];
            });
        });
    };
    return Archive;
}());
export { Archive };
/**
 * Device data that's specific to the device and does not vary based on account
 *
 *   `device.set([key], true)`
 */
export var deviceArchive = new Archive({
    id: 'bsky_archive_device',
});
if (__DEV__ && typeof window !== 'undefined') {
    // @ts-expect-error - dev global
    window.bsky_archive = {
        deviceArchive: deviceArchive,
    };
}
