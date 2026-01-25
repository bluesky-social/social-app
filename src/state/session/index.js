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
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
import { useCloseAllActiveElements } from '#/state/util';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { AnalyticsContext, useAnalyticsBase, utils } from '#/analytics';
import { IS_WEB } from '#/env';
import { emitSessionDropped } from '../events';
import { agentToSessionAccount, createAgentAndCreateAccount, createAgentAndLogin, createAgentAndResume, sessionAccountToSession, } from './agent';
import { getInitialState, reducer } from './reducer';
export { isSignupQueued } from './util';
import { addSessionDebugLog } from './logging';
import { useOnboardingDispatch } from '#/state/shell/onboarding';
import { clearAgeAssuranceData, clearAgeAssuranceDataForDid, } from '#/ageAssurance/data';
var StateContext = React.createContext({
    accounts: [],
    currentAccount: undefined,
    hasSession: false,
});
StateContext.displayName = 'SessionStateContext';
var AgentContext = React.createContext(null);
AgentContext.displayName = 'SessionAgentContext';
var ApiContext = React.createContext({
    createAccount: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
    login: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
    logoutCurrentAccount: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
    logoutEveryAccount: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
    resumeSession: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
    removeAccount: function () { },
    partialRefreshSession: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
});
ApiContext.displayName = 'SessionApiContext';
var SessionStore = /** @class */ (function () {
    function SessionStore() {
        var _this = this;
        this.listeners = new Set();
        this.getState = function () {
            return _this.state;
        };
        this.subscribe = function (listener) {
            _this.listeners.add(listener);
            return function () {
                _this.listeners.delete(listener);
            };
        };
        this.dispatch = function (action) {
            var nextState = reducer(_this.state, action);
            _this.state = nextState;
            // Persist synchronously without waiting for the React render cycle.
            if (nextState.needsPersist) {
                nextState.needsPersist = false;
                var persistedData = {
                    accounts: nextState.accounts,
                    currentAccount: nextState.accounts.find(function (a) { return a.did === nextState.currentAgentState.did; }),
                };
                addSessionDebugLog({ type: 'persisted:broadcast', data: persistedData });
                persisted.write('session', persistedData);
            }
            _this.listeners.forEach(function (listener) { return listener(); });
        };
        // Careful: By the time this runs, `persisted` needs to already be filled.
        var initialState = getInitialState(persisted.get('session').accounts);
        addSessionDebugLog({ type: 'reducer:init', state: initialState });
        this.state = initialState;
    }
    return SessionStore;
}());
export function Provider(_a) {
    var _this = this;
    var children = _a.children;
    var ax = useAnalyticsBase();
    var cancelPendingTask = useOneTaskAtATime();
    var store = React.useState(function () { return new SessionStore(); })[0];
    var state = React.useSyncExternalStore(store.subscribe, store.getState);
    var onboardingDispatch = useOnboardingDispatch();
    var onAgentSessionChange = React.useCallback(function (agent, accountDid, sessionEvent) {
        var refreshedAccount = agentToSessionAccount(agent); // Mutable, so snapshot it right away.
        if (sessionEvent === 'expired' || sessionEvent === 'create-failed') {
            emitSessionDropped();
        }
        store.dispatch({
            type: 'received-agent-event',
            agent: agent,
            refreshedAccount: refreshedAccount,
            accountDid: accountDid,
            sessionEvent: sessionEvent,
        });
    }, [store]);
    var createAccount = React.useCallback(function (params, metrics) { return __awaiter(_this, void 0, void 0, function () {
        var signal, _a, agent, account;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    addSessionDebugLog({ type: 'method:start', method: 'createAccount' });
                    signal = cancelPendingTask();
                    ax.metric('account:create:begin', {});
                    return [4 /*yield*/, createAgentAndCreateAccount(params, onAgentSessionChange)];
                case 1:
                    _a = _b.sent(), agent = _a.agent, account = _a.account;
                    if (signal.aborted) {
                        return [2 /*return*/];
                    }
                    store.dispatch({
                        type: 'switched-to-account',
                        newAgent: agent,
                        newAccount: account,
                    });
                    ax.metric('account:create:success', metrics, {
                        session: utils.accountToSessionMetadata(account),
                    });
                    addSessionDebugLog({ type: 'method:end', method: 'createAccount', account: account });
                    return [2 /*return*/];
            }
        });
    }); }, [ax, store, onAgentSessionChange, cancelPendingTask]);
    var login = React.useCallback(function (params, logContext) { return __awaiter(_this, void 0, void 0, function () {
        var signal, _a, agent, account;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    addSessionDebugLog({ type: 'method:start', method: 'login' });
                    signal = cancelPendingTask();
                    return [4 /*yield*/, createAgentAndLogin(params, onAgentSessionChange)];
                case 1:
                    _a = _b.sent(), agent = _a.agent, account = _a.account;
                    if (signal.aborted) {
                        return [2 /*return*/];
                    }
                    store.dispatch({
                        type: 'switched-to-account',
                        newAgent: agent,
                        newAccount: account,
                    });
                    ax.metric('account:loggedIn', { logContext: logContext, withPassword: true }, { session: utils.accountToSessionMetadata(account) });
                    addSessionDebugLog({ type: 'method:end', method: 'login', account: account });
                    return [2 /*return*/];
            }
        });
    }); }, [ax, store, onAgentSessionChange, cancelPendingTask]);
    var logoutCurrentAccount = React.useCallback(function (logContext) {
        addSessionDebugLog({ type: 'method:start', method: 'logout' });
        cancelPendingTask();
        var prevState = store.getState();
        store.dispatch({
            type: 'logged-out-current-account',
        });
        ax.metric('account:loggedOut', { logContext: logContext, scope: 'current' }, {
            session: utils.accountToSessionMetadata(prevState.accounts.find(function (a) { return a.did === prevState.currentAgentState.did; })),
        });
        addSessionDebugLog({ type: 'method:end', method: 'logout' });
        if (prevState.currentAgentState.did) {
            clearAgeAssuranceDataForDid({ did: prevState.currentAgentState.did });
        }
        // reset onboarding flow on logout
        onboardingDispatch({ type: 'skip' });
    }, [ax, store, cancelPendingTask, onboardingDispatch]);
    var logoutEveryAccount = React.useCallback(function (logContext) {
        addSessionDebugLog({ type: 'method:start', method: 'logout' });
        cancelPendingTask();
        var prevState = store.getState();
        store.dispatch({
            type: 'logged-out-every-account',
        });
        ax.metric('account:loggedOut', { logContext: logContext, scope: 'every' }, {
            session: utils.accountToSessionMetadata(prevState.accounts.find(function (a) { return a.did === prevState.currentAgentState.did; })),
        });
        addSessionDebugLog({ type: 'method:end', method: 'logout' });
        clearAgeAssuranceData();
        // reset onboarding flow on logout
        onboardingDispatch({ type: 'skip' });
    }, [store, cancelPendingTask, onboardingDispatch]);
    var resumeSession = React.useCallback(function (storedAccount_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([storedAccount_1], args_1, true), void 0, function (storedAccount, isSwitchingAccounts) {
            var signal, _a, agent, account;
            if (isSwitchingAccounts === void 0) { isSwitchingAccounts = false; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        addSessionDebugLog({
                            type: 'method:start',
                            method: 'resumeSession',
                            account: storedAccount,
                        });
                        signal = cancelPendingTask();
                        return [4 /*yield*/, createAgentAndResume(storedAccount, onAgentSessionChange)];
                    case 1:
                        _a = _b.sent(), agent = _a.agent, account = _a.account;
                        if (signal.aborted) {
                            return [2 /*return*/];
                        }
                        store.dispatch({
                            type: 'switched-to-account',
                            newAgent: agent,
                            newAccount: account,
                        });
                        addSessionDebugLog({ type: 'method:end', method: 'resumeSession', account: account });
                        if (isSwitchingAccounts) {
                            // reset onboarding flow on switch account
                            onboardingDispatch({ type: 'skip' });
                        }
                        return [2 /*return*/];
                }
            });
        });
    }, [store, onAgentSessionChange, cancelPendingTask, onboardingDispatch]);
    var partialRefreshSession = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var agent, signal, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    agent = state.currentAgentState.agent;
                    signal = cancelPendingTask();
                    return [4 /*yield*/, agent.com.atproto.server.getSession()];
                case 1:
                    data = (_a.sent()).data;
                    if (signal.aborted)
                        return [2 /*return*/];
                    store.dispatch({
                        type: 'partial-refresh-session',
                        accountDid: agent.session.did,
                        patch: {
                            emailConfirmed: data.emailConfirmed,
                            emailAuthFactor: data.emailAuthFactor,
                        },
                    });
                    return [2 /*return*/];
            }
        });
    }); }, [store, state, cancelPendingTask]);
    var removeAccount = React.useCallback(function (account) {
        addSessionDebugLog({
            type: 'method:start',
            method: 'removeAccount',
            account: account,
        });
        cancelPendingTask();
        store.dispatch({
            type: 'removed-account',
            accountDid: account.did,
        });
        addSessionDebugLog({ type: 'method:end', method: 'removeAccount', account: account });
        clearAgeAssuranceDataForDid({ did: account.did });
    }, [store, cancelPendingTask]);
    React.useEffect(function () {
        return persisted.onUpdate('session', function (nextSession) {
            var _a;
            var synced = nextSession;
            addSessionDebugLog({ type: 'persisted:receive', data: synced });
            store.dispatch({
                type: 'synced-accounts',
                syncedAccounts: synced.accounts,
                syncedCurrentDid: (_a = synced.currentAccount) === null || _a === void 0 ? void 0 : _a.did,
            });
            var syncedAccount = synced.accounts.find(function (a) { var _a; return a.did === ((_a = synced.currentAccount) === null || _a === void 0 ? void 0 : _a.did); });
            if (syncedAccount && syncedAccount.refreshJwt) {
                if (syncedAccount.did !== state.currentAgentState.did) {
                    resumeSession(syncedAccount);
                }
                else {
                    var agent_1 = state.currentAgentState.agent;
                    var prevSession = agent_1.session;
                    agent_1.sessionManager.session = sessionAccountToSession(syncedAccount);
                    addSessionDebugLog({
                        type: 'agent:patch',
                        agent: agent_1,
                        prevSession: prevSession,
                        nextSession: agent_1.session,
                    });
                }
            }
        });
    }, [store, state, resumeSession]);
    var stateContext = React.useMemo(function () { return ({
        accounts: state.accounts,
        currentAccount: state.accounts.find(function (a) { return a.did === state.currentAgentState.did; }),
        hasSession: !!state.currentAgentState.did,
    }); }, [state]);
    var api = React.useMemo(function () { return ({
        createAccount: createAccount,
        login: login,
        logoutCurrentAccount: logoutCurrentAccount,
        logoutEveryAccount: logoutEveryAccount,
        resumeSession: resumeSession,
        removeAccount: removeAccount,
        partialRefreshSession: partialRefreshSession,
    }); }, [
        createAccount,
        login,
        logoutCurrentAccount,
        logoutEveryAccount,
        resumeSession,
        removeAccount,
        partialRefreshSession,
    ]);
    // @ts-expect-error window type is not declared, debug only
    if (__DEV__ && IS_WEB)
        window.agent = state.currentAgentState.agent;
    var agent = state.currentAgentState.agent;
    var currentAgentRef = React.useRef(agent);
    React.useEffect(function () {
        if (currentAgentRef.current !== agent) {
            // Read the previous value and immediately advance the pointer.
            var prevAgent = currentAgentRef.current;
            currentAgentRef.current = agent;
            addSessionDebugLog({ type: 'agent:switch', prevAgent: prevAgent, nextAgent: agent });
            // We never reuse agents so let's fully neutralize the previous one.
            // This ensures it won't try to consume any refresh tokens.
            prevAgent.dispose();
        }
    }, [agent]);
    return (_jsx(AgentContext.Provider, { value: agent, children: _jsx(StateContext.Provider, { value: stateContext, children: _jsx(ApiContext.Provider, { value: api, children: _jsx(AnalyticsContext, { metadata: utils.useMeta({
                        session: utils.accountToSessionMetadata(stateContext.currentAccount),
                    }), children: children }) }) }) }));
}
function useOneTaskAtATime() {
    var abortController = React.useRef(null);
    var cancelPendingTask = React.useCallback(function () {
        if (abortController.current) {
            abortController.current.abort();
        }
        abortController.current = new AbortController();
        return abortController.current.signal;
    }, []);
    return cancelPendingTask;
}
export function useSession() {
    return React.useContext(StateContext);
}
export function useSessionApi() {
    return React.useContext(ApiContext);
}
export function useRequireAuth() {
    var hasSession = useSession().hasSession;
    var closeAll = useCloseAllActiveElements();
    var signinDialogControl = useGlobalDialogsControlContext().signinDialogControl;
    return React.useCallback(function (fn) {
        if (hasSession) {
            fn();
        }
        else {
            closeAll();
            signinDialogControl.open();
        }
    }, [hasSession, signinDialogControl, closeAll]);
}
export function useAgent() {
    var agent = React.useContext(AgentContext);
    if (!agent) {
        throw Error('useAgent() must be below <SessionProvider>.');
    }
    return agent;
}
