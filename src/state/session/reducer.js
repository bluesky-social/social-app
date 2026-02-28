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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { unregisterPushToken } from '#/lib/notifications/notifications';
import { logger } from '#/lib/notifications/util';
import { createPublicAgent } from './agent';
import { wrapSessionReducerForLogging } from './logging';
import { createTemporaryAgentsAndResume } from './util';
function createPublicAgentState() {
    return {
        agent: createPublicAgent(),
        did: undefined,
    };
}
export function getInitialState(persistedAccounts) {
    return {
        accounts: persistedAccounts,
        currentAgentState: createPublicAgentState(),
        needsPersist: false,
    };
}
var reducer = function (state, action) {
    var _a, _b;
    switch (action.type) {
        case 'received-agent-event': {
            var agent = action.agent, accountDid_1 = action.accountDid, refreshedAccount_1 = action.refreshedAccount, sessionEvent = action.sessionEvent;
            if (refreshedAccount_1 === undefined &&
                agent !== state.currentAgentState.agent) {
                // If the session got cleared out (e.g. due to expiry or network error) but
                // this account isn't the active one, don't clear it out at this time.
                // This way, if the problem is transient, it'll work on next resume.
                return state;
            }
            if (sessionEvent === 'network-error') {
                // Assume it's transient.
                return state;
            }
            var existingAccount = state.accounts.find(function (a) { return a.did === accountDid_1; });
            if (!existingAccount ||
                JSON.stringify(existingAccount) === JSON.stringify(refreshedAccount_1)) {
                // Fast path without a state update.
                return state;
            }
            return {
                accounts: state.accounts.map(function (a) {
                    if (a.did === accountDid_1) {
                        if (refreshedAccount_1) {
                            return refreshedAccount_1;
                        }
                        else {
                            return __assign(__assign({}, a), { 
                                // If we didn't receive a refreshed account, clear out the tokens.
                                accessJwt: undefined, refreshJwt: undefined });
                        }
                    }
                    else {
                        return a;
                    }
                }),
                currentAgentState: refreshedAccount_1
                    ? state.currentAgentState
                    : createPublicAgentState(), // Log out if expired.
                needsPersist: true,
            };
        }
        case 'switched-to-account': {
            var newAccount_1 = action.newAccount, newAgent = action.newAgent;
            return {
                accounts: __spreadArray([
                    newAccount_1
                ], state.accounts.filter(function (a) { return a.did !== newAccount_1.did; }), true),
                currentAgentState: {
                    did: newAccount_1.did,
                    agent: newAgent,
                },
                needsPersist: true,
            };
        }
        case 'removed-account': {
            var accountDid_2 = action.accountDid;
            // side effect
            var account = state.accounts.find(function (a) { return a.did === accountDid_2; });
            if (account) {
                createTemporaryAgentsAndResume([account])
                    .then(function (agents) { return unregisterPushToken(agents); })
                    .then(function () {
                    return logger.debug('Push token unregistered', { did: accountDid_2 });
                })
                    .catch(function (err) {
                    logger.error('Failed to unregister push token', {
                        did: accountDid_2,
                        error: err,
                    });
                });
            }
            return {
                accounts: state.accounts.filter(function (a) { return a.did !== accountDid_2; }),
                currentAgentState: state.currentAgentState.did === accountDid_2
                    ? createPublicAgentState() // Log out if removing the current one.
                    : state.currentAgentState,
                needsPersist: true,
            };
        }
        case 'logged-out-current-account': {
            var currentAgentState = state.currentAgentState;
            var accountDid_3 = currentAgentState.did;
            // side effect
            var account = state.accounts.find(function (a) { return a.did === accountDid_3; });
            if (account && accountDid_3) {
                createTemporaryAgentsAndResume([account])
                    .then(function (agents) { return unregisterPushToken(agents); })
                    .then(function () {
                    return logger.debug('Push token unregistered', { did: accountDid_3 });
                })
                    .catch(function (err) {
                    logger.error('Failed to unregister push token', {
                        did: accountDid_3,
                        error: err,
                    });
                });
            }
            return {
                accounts: state.accounts.map(function (a) {
                    return a.did === accountDid_3
                        ? __assign(__assign({}, a), { refreshJwt: undefined, accessJwt: undefined }) : a;
                }),
                currentAgentState: createPublicAgentState(),
                needsPersist: true,
            };
        }
        case 'logged-out-every-account': {
            createTemporaryAgentsAndResume(state.accounts)
                .then(function (agents) { return unregisterPushToken(agents); })
                .then(function () { return logger.debug('Push token unregistered'); })
                .catch(function (err) {
                logger.error('Failed to unregister push token', {
                    error: err,
                });
            });
            return {
                accounts: state.accounts.map(function (a) { return (__assign(__assign({}, a), { 
                    // Clear tokens for *every* account (this is a hard logout).
                    refreshJwt: undefined, accessJwt: undefined })); }),
                currentAgentState: createPublicAgentState(),
                needsPersist: true,
            };
        }
        case 'synced-accounts': {
            var syncedAccounts = action.syncedAccounts, syncedCurrentDid = action.syncedCurrentDid;
            return {
                accounts: syncedAccounts,
                currentAgentState: syncedCurrentDid === state.currentAgentState.did
                    ? state.currentAgentState
                    : createPublicAgentState(), // Log out if different user.
                needsPersist: false, // Synced from another tab. Don't persist to avoid cycles.
            };
        }
        case 'partial-refresh-session': {
            var accountDid_4 = action.accountDid, patch_1 = action.patch;
            var agent = state.currentAgentState.agent;
            /*
             * Only mutating values that are safe. Be very careful with this.
             */
            if (agent.session) {
                agent.session.emailConfirmed =
                    (_a = patch_1.emailConfirmed) !== null && _a !== void 0 ? _a : agent.session.emailConfirmed;
                agent.session.emailAuthFactor =
                    (_b = patch_1.emailAuthFactor) !== null && _b !== void 0 ? _b : agent.session.emailAuthFactor;
            }
            return __assign(__assign({}, state), { currentAgentState: __assign(__assign({}, state.currentAgentState), { agent: agent }), accounts: state.accounts.map(function (a) {
                    var _a, _b;
                    if (a.did === accountDid_4) {
                        return __assign(__assign({}, a), { emailConfirmed: (_a = patch_1.emailConfirmed) !== null && _a !== void 0 ? _a : a.emailConfirmed, emailAuthFactor: (_b = patch_1.emailAuthFactor) !== null && _b !== void 0 ? _b : a.emailAuthFactor });
                    }
                    return a;
                }), needsPersist: true });
        }
    }
};
reducer = wrapSessionReducerForLogging(reducer);
export { reducer };
