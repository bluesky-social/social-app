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
import { SUPPORTED_MIME_TYPES } from '#/lib/constants';
// mostly copied from expo-image-picker and adapted to support gifs
// also adds support for reading video metadata
export function pickVideo() {
    return __awaiter(this, void 0, void 0, function () {
        var input;
        var _this = this;
        return __generator(this, function (_a) {
            input = document.createElement('input');
            input.style.display = 'none';
            input.setAttribute('type', 'file');
            // TODO: do we need video/* here? -sfn
            input.setAttribute('accept', SUPPORTED_MIME_TYPES.join(','));
            input.setAttribute('id', String(Math.random()));
            document.body.appendChild(input);
            return [2 /*return*/, new Promise(function (resolve) {
                    input.addEventListener('change', function () { return __awaiter(_this, void 0, void 0, function () {
                        var file, _a;
                        var _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    if (!input.files) return [3 /*break*/, 2];
                                    file = input.files[0];
                                    _a = resolve;
                                    _b = {
                                        canceled: false
                                    };
                                    return [4 /*yield*/, getVideoMetadata(file)];
                                case 1:
                                    _a.apply(void 0, [(_b.assets = [_c.sent()],
                                            _b)]);
                                    return [3 /*break*/, 3];
                                case 2:
                                    resolve({ canceled: true, assets: null });
                                    _c.label = 3;
                                case 3:
                                    document.body.removeChild(input);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    var event = new MouseEvent('click');
                    input.dispatchEvent(event);
                })];
        });
    });
}
// TODO: we're converting to a dataUrl here, and then converting back to an
// ArrayBuffer in the compressVideo function. This is a bit wasteful, but it
// lets us use the ImagePickerAsset type, which the rest of the code expects.
// We should unwind this and just pass the ArrayBuffer/objectUrl through the system
// instead of a string -sfn
export var getVideoMetadata = function (file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
            var uri = reader.result;
            if (file.type === 'image/gif') {
                var img_1 = new Image();
                img_1.onload = function () {
                    resolve({
                        uri: uri,
                        mimeType: 'image/gif',
                        width: img_1.width,
                        height: img_1.height,
                        // todo: calculate gif duration. seems possible if you read the bytes
                        // https://codepen.io/Ryman/pen/nZpYwY
                        // for now let's just let the server reject it, since that seems uncommon -sfn
                        duration: null,
                    });
                };
                img_1.onerror = function (_ev, _source, _lineno, _colno, error) {
                    console.log('Failed to grab GIF metadata', error);
                    reject(new Error('Failed to grab GIF metadata'));
                };
                img_1.src = uri;
            }
            else {
                var video_1 = document.createElement('video');
                var blobUrl_1 = URL.createObjectURL(file);
                video_1.preload = 'metadata';
                video_1.src = blobUrl_1;
                video_1.onloadedmetadata = function () {
                    URL.revokeObjectURL(blobUrl_1);
                    resolve({
                        uri: uri,
                        mimeType: file.type,
                        width: video_1.videoWidth,
                        height: video_1.videoHeight,
                        // convert seconds to ms
                        duration: video_1.duration * 1000,
                    });
                };
                video_1.onerror = function (_ev, _source, _lineno, _colno, error) {
                    URL.revokeObjectURL(blobUrl_1);
                    console.log('Failed to grab video metadata', error);
                    reject(new Error('Failed to grab video metadata'));
                };
            }
        };
        reader.readAsDataURL(file);
    });
};
