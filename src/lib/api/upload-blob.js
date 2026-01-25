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
import { copyAsync } from 'expo-file-system/legacy';
import { safeDeleteAsync } from '#/lib/media/manip';
/**
 * @param encoding Allows overriding the blob's type
 */
export function uploadBlob(agent, input, encoding) {
    return __awaiter(this, void 0, void 0, function () {
        var blob, blob, blob;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(typeof input === 'string' && input.startsWith('file:'))) return [3 /*break*/, 2];
                    return [4 /*yield*/, asBlob(input)];
                case 1:
                    blob = _a.sent();
                    return [2 /*return*/, agent.uploadBlob(blob, { encoding: encoding })];
                case 2:
                    if (!(typeof input === 'string' && input.startsWith('/'))) return [3 /*break*/, 4];
                    return [4 /*yield*/, asBlob("file://".concat(input))];
                case 3:
                    blob = _a.sent();
                    return [2 /*return*/, agent.uploadBlob(blob, { encoding: encoding })];
                case 4:
                    if (!(typeof input === 'string' && input.startsWith('data:'))) return [3 /*break*/, 6];
                    return [4 /*yield*/, fetch(input).then(function (r) { return r.blob(); })];
                case 5:
                    blob = _a.sent();
                    return [2 /*return*/, agent.uploadBlob(blob, { encoding: encoding })];
                case 6:
                    if (input instanceof Blob) {
                        return [2 /*return*/, agent.uploadBlob(input, { encoding: encoding })];
                    }
                    throw new TypeError("Invalid uploadBlob input: ".concat(typeof input));
            }
        });
    });
}
function asBlob(uri) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, withSafeFile(uri, function (safeUri) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                                    var xhr = new XMLHttpRequest();
                                    xhr.onload = function () { return resolve(xhr.response); };
                                    xhr.onerror = function () { return reject(new Error('Failed to load blob')); };
                                    xhr.responseType = 'blob';
                                    xhr.open('GET', safeUri, true);
                                    xhr.send(null);
                                })];
                            case 1: 
                            // Note
                            // Android does not support `fetch()` on `file://` URIs. for this reason, we
                            // use XMLHttpRequest instead of simply calling:
                            // return fetch(safeUri.replace('file:///', 'file:/')).then(r => r.blob())
                            return [2 /*return*/, _a.sent()];
                        }
                    });
                }); })];
        });
    });
}
// HACK
// React native has a bug that inflates the size of jpegs on upload
// we get around that by renaming the file ext to .bin
// see https://github.com/facebook/react-native/issues/27099
// -prf
function withSafeFile(uri, fn) {
    return __awaiter(this, void 0, void 0, function () {
        var newPath, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(uri.endsWith('.jpeg') || uri.endsWith('.jpg'))) return [3 /*break*/, 10];
                    newPath = uri.replace(/\.jpe?g$/, '.bin');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 5]);
                    return [4 /*yield*/, copyAsync({ from: uri, to: newPath })];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    return [4 /*yield*/, fn(uri)];
                case 4: 
                // Failed to copy the file, just use the original
                return [2 /*return*/, _b.sent()];
                case 5:
                    _b.trys.push([5, , 7, 9]);
                    return [4 /*yield*/, fn(newPath)];
                case 6: return [2 /*return*/, _b.sent()];
                case 7: 
                // Remove the temporary file
                return [4 /*yield*/, safeDeleteAsync(newPath)];
                case 8:
                    // Remove the temporary file
                    _b.sent();
                    return [7 /*endfinally*/];
                case 9: return [3 /*break*/, 11];
                case 10: return [2 /*return*/, fn(uri)];
                case 11: return [2 /*return*/];
            }
        });
    });
}
