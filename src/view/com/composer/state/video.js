var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
import { msg } from '@lingui/core/macro';
import { AbortError } from '#/lib/async/cancelable';
import { compressVideo } from '#/lib/media/video/compress';
import { ServerError, UploadLimitError, VideoTooLargeError, } from '#/lib/media/video/errors';
import { uploadVideo } from '#/lib/media/video/upload';
import { createVideoAgent } from '#/lib/media/video/util';
import { isNetworkError } from '#/lib/strings/errors';
import { logger } from '#/logger';
var noopController = new AbortController();
noopController.abort();
export var NO_VIDEO = Object.freeze({
    status: 'idle',
    progress: 0,
    abortController: noopController,
    asset: undefined,
    video: undefined,
    jobId: undefined,
    pendingPublish: undefined,
    altText: '',
    captions: [],
});
export function createVideoState(asset, abortController) {
    return {
        status: 'compressing',
        progress: 0,
        abortController: abortController,
        asset: asset,
        altText: '',
        captions: [],
    };
}
export function videoReducer(state, action) {
    var _a, _b, _c;
    if (action.signal.aborted || action.signal !== state.abortController.signal) {
        // This action is stale and the process that spawned it is no longer relevant.
        return state;
    }
    if (action.type === 'to_error') {
        return {
            status: 'error',
            progress: 100,
            abortController: state.abortController,
            error: action.error,
            asset: (_a = state.asset) !== null && _a !== void 0 ? _a : null,
            video: (_b = state.video) !== null && _b !== void 0 ? _b : null,
            jobId: (_c = state.jobId) !== null && _c !== void 0 ? _c : null,
            altText: state.altText,
            captions: state.captions,
        };
    }
    else if (action.type === 'update_progress') {
        if (state.status === 'compressing' || state.status === 'uploading') {
            return __assign(__assign({}, state), { progress: action.progress });
        }
    }
    else if (action.type === 'update_alt_text') {
        return __assign(__assign({}, state), { altText: action.altText });
    }
    else if (action.type === 'update_captions') {
        return __assign(__assign({}, state), { captions: action.updater(state.captions) });
    }
    else if (action.type === 'compressing_to_uploading') {
        if (state.status === 'compressing') {
            return {
                status: 'uploading',
                progress: 0,
                abortController: state.abortController,
                asset: state.asset,
                video: action.video,
                altText: state.altText,
                captions: state.captions,
            };
        }
        return state;
    }
    else if (action.type === 'uploading_to_processing') {
        if (state.status === 'uploading') {
            return {
                status: 'processing',
                progress: 0,
                abortController: state.abortController,
                asset: state.asset,
                video: state.video,
                jobId: action.jobId,
                jobStatus: null,
                altText: state.altText,
                captions: state.captions,
            };
        }
    }
    else if (action.type === 'update_job_status') {
        if (state.status === 'processing') {
            return __assign(__assign({}, state), { jobStatus: action.jobStatus, progress: action.jobStatus.progress !== undefined
                    ? action.jobStatus.progress / 100
                    : state.progress });
        }
    }
    else if (action.type === 'to_done') {
        if (state.status === 'processing') {
            return {
                status: 'done',
                progress: 100,
                abortController: state.abortController,
                asset: state.asset,
                video: state.video,
                pendingPublish: {
                    blobRef: action.blobRef,
                },
                altText: state.altText,
                captions: state.captions,
            };
        }
    }
    console.error('Unexpected video action (' +
        action.type +
        ') while in ' +
        state.status +
        ' state');
    return state;
}
function trunc2dp(num) {
    return Math.trunc(num * 100) / 100;
}
export function processVideo(asset, dispatch, agent, did, signal, _) {
    return __awaiter(this, void 0, void 0, function () {
        var video, e_1, message, uploadResponse, e_2, message, jobId, pollFailures, videoAgent, status_1, blob, response, e_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, compressVideo(asset, {
                            onProgress: function (num) {
                                dispatch({ type: 'update_progress', progress: trunc2dp(num), signal: signal });
                            },
                            signal: signal,
                        })];
                case 1:
                    video = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _b.sent();
                    message = getCompressErrorMessage(e_1, _);
                    if (message !== null) {
                        dispatch({
                            type: 'to_error',
                            error: message,
                            signal: signal,
                        });
                    }
                    return [2 /*return*/];
                case 3:
                    dispatch({
                        type: 'compressing_to_uploading',
                        video: video,
                        signal: signal,
                    });
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, uploadVideo({
                            video: video,
                            agent: agent,
                            did: did,
                            signal: signal,
                            _: _,
                            setProgress: function (p) {
                                dispatch({ type: 'update_progress', progress: p, signal: signal });
                            },
                        })];
                case 5:
                    uploadResponse = _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    e_2 = _b.sent();
                    message = getUploadErrorMessage(e_2, _);
                    if (message !== null) {
                        dispatch({
                            type: 'to_error',
                            error: message,
                            signal: signal,
                        });
                    }
                    return [2 /*return*/];
                case 7:
                    jobId = uploadResponse.jobId;
                    dispatch({
                        type: 'uploading_to_processing',
                        jobId: jobId,
                        signal: signal,
                    });
                    pollFailures = 0;
                    _b.label = 8;
                case 8:
                    if (!true) return [3 /*break*/, 17];
                    if (signal.aborted) {
                        return [2 /*return*/]; // Exit async loop
                    }
                    videoAgent = createVideoAgent();
                    status_1 = void 0;
                    blob = void 0;
                    _b.label = 9;
                case 9:
                    _b.trys.push([9, 11, , 14]);
                    return [4 /*yield*/, videoAgent.app.bsky.video.getJobStatus({ jobId: jobId })];
                case 10:
                    response = _b.sent();
                    status_1 = response.data.jobStatus;
                    pollFailures = 0;
                    if (status_1.state === 'JOB_STATE_COMPLETED') {
                        blob = status_1.blob;
                        if (!blob) {
                            throw new Error('Job completed, but did not return a blob');
                        }
                    }
                    else if (status_1.state === 'JOB_STATE_FAILED') {
                        throw new Error((_a = status_1.error) !== null && _a !== void 0 ? _a : 'Job failed to process');
                    }
                    return [3 /*break*/, 14];
                case 11:
                    e_3 = _b.sent();
                    if (!!status_1) return [3 /*break*/, 13];
                    pollFailures++;
                    if (!(pollFailures < 50)) return [3 /*break*/, 13];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                case 12:
                    _b.sent();
                    return [3 /*break*/, 8]; // Continue async loop
                case 13:
                    logger.error('Error processing video', { safeMessage: e_3 });
                    dispatch({
                        type: 'to_error',
                        error: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Video failed to process"], ["Video failed to process"])))),
                        signal: signal,
                    });
                    return [2 /*return*/]; // Exit async loop
                case 14:
                    if (blob) {
                        dispatch({
                            type: 'to_done',
                            blobRef: blob,
                            signal: signal,
                        });
                    }
                    else {
                        dispatch({
                            type: 'update_job_status',
                            jobStatus: status_1,
                            signal: signal,
                        });
                    }
                    if (!(status_1.state !== 'JOB_STATE_COMPLETED' &&
                        status_1.state !== 'JOB_STATE_FAILED')) return [3 /*break*/, 16];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
                case 15:
                    _b.sent();
                    return [3 /*break*/, 8]; // Continue async loop
                case 16: return [2 /*return*/]; // Exit async loop
                case 17: return [2 /*return*/];
            }
        });
    });
}
function getCompressErrorMessage(e, _) {
    if (e instanceof AbortError) {
        return null;
    }
    if (e instanceof VideoTooLargeError) {
        return _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["The selected video is larger than 100\u00A0MB. Please try again with a smaller file."], ["The selected video is larger than 100\u00A0MB. Please try again with a smaller file."]))));
    }
    logger.error('Error compressing video', { safeMessage: e });
    return _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["An error occurred while compressing the video."], ["An error occurred while compressing the video."]))));
}
function getUploadErrorMessage(e, _) {
    if (e instanceof AbortError) {
        return null;
    }
    if (e instanceof ServerError || e instanceof UploadLimitError) {
        // https://github.com/bluesky-social/tango/blob/lumi/lumi/worker/permissions.go#L77
        switch (e.message) {
            case 'User is not allowed to upload videos':
                return _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["You are not allowed to upload videos."], ["You are not allowed to upload videos."]))));
            case 'Uploading is disabled at the moment':
                return _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Hold up! We\u2019re gradually giving access to video, and you\u2019re still waiting in line. Check back soon!"], ["Hold up! We\u2019re gradually giving access to video, and you\u2019re still waiting in line. Check back soon!"]))));
            case "Failed to get user's upload stats":
                return _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["We were unable to determine if you are allowed to upload videos. Please try again."], ["We were unable to determine if you are allowed to upload videos. Please try again."]))));
            case 'User has exceeded daily upload bytes limit':
                return _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["You've reached your daily limit for video uploads (too many bytes)"], ["You've reached your daily limit for video uploads (too many bytes)"]))));
            case 'User has exceeded daily upload videos limit':
                return _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["You've reached your daily limit for video uploads (too many videos)"], ["You've reached your daily limit for video uploads (too many videos)"]))));
            case 'Account is not old enough to upload videos':
                return _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Your account is not yet old enough to upload videos. Please try again later."], ["Your account is not yet old enough to upload videos. Please try again later."]))));
            case 'file size (100000001 bytes) is larger than the maximum allowed size (100000000 bytes)':
                return _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["The selected video is larger than 100\u00A0MB. Please try again with a smaller file."], ["The selected video is larger than 100\u00A0MB. Please try again with a smaller file."]))));
            case 'Confirm your email address to upload videos':
                return _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Please confirm your email address to upload videos."], ["Please confirm your email address to upload videos."]))));
        }
    }
    if (isNetworkError(e)) {
        return _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["An error occurred while uploading the video. Please check your internet connection and try again."], ["An error occurred while uploading the video. Please check your internet connection and try again."]))));
    }
    else {
        // only log errors if they are unknown (and not network errors)
        logger.error('Error uploading video', { safeMessage: e });
    }
    var message = e instanceof Error ? e.message : '';
    return _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["An error occurred while uploading the video. ", ""], ["An error occurred while uploading the video. ", ""])), message));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13;
