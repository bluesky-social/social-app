var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { createUploadTask, FileSystemUploadType } from 'expo-file-system/legacy';
import { msg } from '@lingui/core/macro';
import { nanoid } from 'nanoid/non-secure';
import { AbortError } from '#/lib/async/cancelable';
import { ServerError } from '#/lib/media/video/errors';
import { getServiceAuthToken, getVideoUploadLimits } from './upload.shared';
import { createVideoEndpointUrl, mimeToExt } from './util';
export function uploadVideo(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var uri, token, uploadTask, res, responseBody;
        var video = _b.video, agent = _b.agent, did = _b.did, setProgress = _b.setProgress, signal = _b.signal, _ = _b._;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (signal.aborted) {
                        throw new AbortError();
                    }
                    return [4 /*yield*/, getVideoUploadLimits(agent, _)];
                case 1:
                    _c.sent();
                    uri = createVideoEndpointUrl('/xrpc/app.bsky.video.uploadVideo', {
                        did: did,
                        name: "".concat(nanoid(12), ".").concat(mimeToExt(video.mimeType)),
                    });
                    if (signal.aborted) {
                        throw new AbortError();
                    }
                    return [4 /*yield*/, getServiceAuthToken({
                            agent: agent,
                            lxm: 'com.atproto.repo.uploadBlob',
                            exp: Date.now() / 1000 + 60 * 30, // 30 minutes
                        })];
                case 2:
                    token = _c.sent();
                    uploadTask = createUploadTask(uri, video.uri, {
                        headers: {
                            'content-type': video.mimeType,
                            Authorization: "Bearer ".concat(token),
                        },
                        httpMethod: 'POST',
                        uploadType: FileSystemUploadType.BINARY_CONTENT,
                    }, function (p) { return setProgress(p.totalBytesSent / p.totalBytesExpectedToSend); });
                    if (signal.aborted) {
                        throw new AbortError();
                    }
                    return [4 /*yield*/, uploadTask.uploadAsync()];
                case 3:
                    res = _c.sent();
                    if (!(res === null || res === void 0 ? void 0 : res.body)) {
                        throw new Error('No response');
                    }
                    responseBody = JSON.parse(res.body);
                    if (!responseBody.jobId) {
                        throw new ServerError(responseBody.error || _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Failed to upload video"], ["Failed to upload video"])))));
                    }
                    if (signal.aborted) {
                        throw new AbortError();
                    }
                    return [2 /*return*/, responseBody];
            }
        });
    });
}
var templateObject_1;
