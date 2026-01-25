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
import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '#/logger';
import { useVideoVolumeState } from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext';
import { IS_WEB_SAFARI } from '#/env';
export function useVideoElement(ref) {
    var _this = this;
    var _a = useState(false), playing = _a[0], setPlaying = _a[1];
    var _b = useState(true), muted = _b[0], setMuted = _b[1];
    var _c = useState(0), currentTime = _c[0], setCurrentTime = _c[1];
    var _d = useVideoVolumeState(), volume = _d[0], setVolume = _d[1];
    var _e = useState(0), duration = _e[0], setDuration = _e[1];
    var _f = useState(false), buffering = _f[0], setBuffering = _f[1];
    var _g = useState(false), error = _g[0], setError = _g[1];
    var _h = useState(false), canPlay = _h[0], setCanPlay = _h[1];
    var playWhenReadyRef = useRef(false);
    useEffect(function () {
        if (!ref.current)
            return;
        ref.current.volume = volume;
    }, [ref, volume]);
    useEffect(function () {
        if (!ref.current)
            return;
        var bufferingTimeout;
        function round(num) {
            return Math.round(num * 100) / 100;
        }
        // Initial values
        setCurrentTime(round(ref.current.currentTime) || 0);
        setDuration(round(ref.current.duration) || 0);
        setMuted(ref.current.muted);
        setPlaying(!ref.current.paused);
        setVolume(ref.current.volume);
        var handleTimeUpdate = function () {
            if (!ref.current)
                return;
            setCurrentTime(round(ref.current.currentTime) || 0);
            // HACK: Safari randomly fires `stalled` events when changing between segments
            // let's just clear the buffering state if the video is still progressing -sfn
            if (IS_WEB_SAFARI) {
                if (bufferingTimeout)
                    clearTimeout(bufferingTimeout);
                setBuffering(false);
            }
        };
        var handleDurationChange = function () {
            if (!ref.current)
                return;
            setDuration(round(ref.current.duration) || 0);
        };
        var handlePlay = function () {
            setPlaying(true);
        };
        var handlePause = function () {
            setPlaying(false);
        };
        var handleVolumeChange = function () {
            if (!ref.current)
                return;
            setMuted(ref.current.muted);
        };
        var handleError = function () {
            setError(true);
        };
        var handleCanPlay = function () { return __awaiter(_this, void 0, void 0, function () {
            var e_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (bufferingTimeout)
                            clearTimeout(bufferingTimeout);
                        setBuffering(false);
                        setCanPlay(true);
                        if (!ref.current)
                            return [2 /*return*/];
                        if (!playWhenReadyRef.current) return [3 /*break*/, 5];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ref.current.play()];
                    case 2:
                        _c.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _c.sent();
                        if (!((_a = e_1.message) === null || _a === void 0 ? void 0 : _a.includes("The request is not allowed by the user agent")) &&
                            !((_b = e_1.message) === null || _b === void 0 ? void 0 : _b.includes("The play() request was interrupted by a call to pause()"))) {
                            throw e_1;
                        }
                        return [3 /*break*/, 4];
                    case 4:
                        playWhenReadyRef.current = false;
                        _c.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        var handleCanPlayThrough = function () {
            if (bufferingTimeout)
                clearTimeout(bufferingTimeout);
            setBuffering(false);
        };
        var handleWaiting = function () {
            if (bufferingTimeout)
                clearTimeout(bufferingTimeout);
            bufferingTimeout = setTimeout(function () {
                setBuffering(true);
            }, 500); // Delay to avoid frequent buffering state changes
        };
        var handlePlaying = function () {
            if (bufferingTimeout)
                clearTimeout(bufferingTimeout);
            setBuffering(false);
            setError(false);
        };
        var handleStalled = function () {
            if (bufferingTimeout)
                clearTimeout(bufferingTimeout);
            bufferingTimeout = setTimeout(function () {
                setBuffering(true);
            }, 500); // Delay to avoid frequent buffering state changes
        };
        var handleEnded = function () {
            setPlaying(false);
            setBuffering(false);
            setError(false);
        };
        var abortController = new AbortController();
        ref.current.addEventListener('timeupdate', handleTimeUpdate, {
            signal: abortController.signal,
        });
        ref.current.addEventListener('durationchange', handleDurationChange, {
            signal: abortController.signal,
        });
        ref.current.addEventListener('play', handlePlay, {
            signal: abortController.signal,
        });
        ref.current.addEventListener('pause', handlePause, {
            signal: abortController.signal,
        });
        ref.current.addEventListener('volumechange', handleVolumeChange, {
            signal: abortController.signal,
        });
        ref.current.addEventListener('error', handleError, {
            signal: abortController.signal,
        });
        ref.current.addEventListener('canplay', handleCanPlay, {
            signal: abortController.signal,
        });
        ref.current.addEventListener('canplaythrough', handleCanPlayThrough, {
            signal: abortController.signal,
        });
        ref.current.addEventListener('waiting', handleWaiting, {
            signal: abortController.signal,
        });
        ref.current.addEventListener('playing', handlePlaying, {
            signal: abortController.signal,
        });
        ref.current.addEventListener('stalled', handleStalled, {
            signal: abortController.signal,
        });
        ref.current.addEventListener('ended', handleEnded, {
            signal: abortController.signal,
        });
        return function () {
            abortController.abort();
            clearTimeout(bufferingTimeout);
        };
    }, [ref, setVolume]);
    var play = useCallback(function () {
        if (!ref.current)
            return;
        if (ref.current.ended) {
            ref.current.currentTime = 0;
        }
        if (ref.current.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
            playWhenReadyRef.current = true;
        }
        else {
            var promise = ref.current.play();
            if (promise !== undefined) {
                promise.catch(function (err) {
                    var _a;
                    if (
                    // ignore this common error. it's fine
                    !((_a = err.message) === null || _a === void 0 ? void 0 : _a.includes("The play() request was interrupted by a call to pause()"))) {
                        logger.error('Error playing video:', { message: err });
                    }
                });
            }
        }
    }, [ref]);
    var pause = useCallback(function () {
        if (!ref.current)
            return;
        ref.current.pause();
        playWhenReadyRef.current = false;
    }, [ref]);
    var togglePlayPause = useCallback(function () {
        if (!ref.current)
            return;
        if (ref.current.paused) {
            play();
        }
        else {
            pause();
        }
    }, [ref, play, pause]);
    var changeMuted = useCallback(function (newMuted) {
        if (!ref.current)
            return;
        var value = typeof newMuted === 'function' ? newMuted(ref.current.muted) : newMuted;
        ref.current.muted = value;
    }, [ref]);
    return {
        play: play,
        pause: pause,
        togglePlayPause: togglePlayPause,
        duration: duration,
        currentTime: currentTime,
        playing: playing,
        muted: muted,
        changeMuted: changeMuted,
        buffering: buffering,
        error: error,
        canPlay: canPlay,
    };
}
export function formatTime(time) {
    if (isNaN(time)) {
        return '--';
    }
    time = Math.round(time);
    var minutes = Math.floor(time / 60);
    var seconds = String(time % 60).padStart(2, '0');
    return "".concat(minutes, ":").concat(seconds);
}
