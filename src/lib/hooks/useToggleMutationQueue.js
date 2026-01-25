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
function AbortError() {
    var e = new Error();
    e.name = 'AbortError';
    return e;
}
export function useToggleMutationQueue(_a) {
    var initialState = _a.initialState, runMutation = _a.runMutation, onSuccess = _a.onSuccess;
    // We use the queue as a mutable object.
    // This is safe becuase it is not used for rendering.
    var queue = useState({
        activeTask: null,
        queuedTask: null,
    })[0];
    function processQueue() {
        return __awaiter(this, void 0, void 0, function () {
            var confirmedState, prevTask, nextTask, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (queue.activeTask) {
                            // There is another active processQueue call iterating over tasks.
                            // It will handle any newly added tasks, so we should exit early.
                            return [2 /*return*/];
                        }
                        confirmedState = initialState;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 8, 9]);
                        _a.label = 2;
                    case 2:
                        if (!queue.queuedTask) return [3 /*break*/, 7];
                        prevTask = queue.activeTask;
                        nextTask = queue.queuedTask;
                        queue.activeTask = nextTask;
                        queue.queuedTask = null;
                        if ((prevTask === null || prevTask === void 0 ? void 0 : prevTask.isOn) === nextTask.isOn) {
                            // Skip multiple requests to update to the same value in a row.
                            prevTask.reject(new AbortError());
                            return [3 /*break*/, 2];
                        }
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, runMutation(confirmedState, nextTask.isOn)];
                    case 4:
                        // The state received from the server feeds into the next task.
                        // This lets us queue deletions of not-yet-created resources.
                        confirmedState = _a.sent();
                        nextTask.resolve(confirmedState);
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        nextTask.reject(e_1);
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 2];
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        onSuccess(confirmedState);
                        queue.activeTask = null;
                        queue.queuedTask = null;
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    }
    function queueToggle(isOn) {
        return new Promise(function (resolve, reject) {
            // This is a toggle, so the next queued value can safely replace the queued one.
            if (queue.queuedTask) {
                queue.queuedTask.reject(new AbortError());
            }
            queue.queuedTask = { isOn: isOn, resolve: resolve, reject: reject };
            processQueue();
        });
    }
    var queueToggleRef = useRef(queueToggle);
    useEffect(function () {
        queueToggleRef.current = queueToggle;
    });
    var queueToggleStable = useCallback(function (isOn) {
        var queueToggleLatest = queueToggleRef.current;
        return queueToggleLatest(isOn);
    }, []);
    return queueToggleStable;
}
