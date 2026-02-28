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
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import * as persisted from '#/state/persisted';
import { useAgent, useSession } from '../session';
var stateContext = React.createContext(new Map());
stateContext.displayName = 'ThreadMutesStateContext';
var setStateContext = React.createContext(function (_) { return false; });
setStateContext.displayName = 'ThreadMutesSetStateContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(function () { return new Map(); }), state = _b[0], setState = _b[1];
    var setThreadMute = React.useCallback(function (uri, value) {
        setState(function (prev) {
            var next = new Map(prev);
            next.set(uri, value);
            return next;
        });
    }, [setState]);
    useMigrateMutes(setThreadMute);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(setStateContext.Provider, { value: setThreadMute, children: children }) }));
}
export function useMutedThreads() {
    return React.useContext(stateContext);
}
export function useIsThreadMuted(uri, defaultValue) {
    var _a;
    if (defaultValue === void 0) { defaultValue = false; }
    var state = React.useContext(stateContext);
    return (_a = state.get(uri)) !== null && _a !== void 0 ? _a : defaultValue;
}
export function useSetThreadMute() {
    return React.useContext(setStateContext);
}
function useMigrateMutes(setThreadMute) {
    var _this = this;
    var agent = useAgent();
    var currentAccount = useSession().currentAccount;
    useEffect(function () {
        if (currentAccount) {
            if (!persisted
                .get('mutedThreads')
                .some(function (uri) { return uri.includes(currentAccount.did); })) {
                return;
            }
            var cancelled_1 = false;
            var migrate = function () { return __awaiter(_this, void 0, void 0, function () {
                var _loop_1, state_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _loop_1 = function () {
                                var threads, root;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            threads = persisted.get('mutedThreads');
                                            root = threads.findLast(function (uri) { return uri.includes(currentAccount.did); });
                                            if (!root)
                                                return [2 /*return*/, "break"];
                                            persisted.write('mutedThreads', threads.filter(function (uri) { return uri !== root; }));
                                            setThreadMute(root, true);
                                            return [4 /*yield*/, agent.api.app.bsky.graph
                                                    .muteThread({ root: root })
                                                    // not a big deal if this fails, since the post might have been deleted
                                                    .catch(console.error)];
                                        case 1:
                                            _b.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            };
                            _a.label = 1;
                        case 1:
                            if (!!cancelled_1) return [3 /*break*/, 3];
                            return [5 /*yield**/, _loop_1()];
                        case 2:
                            state_1 = _a.sent();
                            if (state_1 === "break")
                                return [3 /*break*/, 3];
                            return [3 /*break*/, 1];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            migrate();
            return function () {
                cancelled_1 = true;
            };
        }
    }, [agent, currentAccount, setThreadMute]);
}
