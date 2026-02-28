var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { Agent as BaseAgent, BskyAgent, } from '@atproto/api';
import { TID } from '@atproto/common-web';
import { networkRetry } from '#/lib/async/retry';
import { BLUESKY_PROXY_HEADER, BSKY_SERVICE, DISCOVER_SAVED_FEED, IS_PROD_SERVICE, PUBLIC_BSKY_SERVICE, TIMELINE_SAVED_FEED, } from '#/lib/constants';
import { getAge } from '#/lib/strings/time';
import { logger } from '#/logger';
import { snoozeBirthdateUpdateAllowedForDid } from '#/state/birthdate';
import { snoozeEmailConfirmationPrompt } from '#/state/shell/reminders';
import { prefetchAgeAssuranceData, setBirthdateForDid, setCreatedAtForDid, } from '#/ageAssurance/data';
import { features } from '#/analytics';
import { emitNetworkConfirmed, emitNetworkLost } from '../events';
import { addSessionErrorLog } from './logging';
import { configureModerationForAccount, configureModerationForGuest, } from './moderation';
import { isSessionExpired, isSignupQueued } from './util';
export function createPublicAgent() {
    configureModerationForGuest(); // Side effect but only relevant for tests
    var agent = new BskyAppAgent({ service: PUBLIC_BSKY_SERVICE });
    agent.configureProxy(BLUESKY_PROXY_HEADER.get());
    return agent;
}
export function createAgentAndResume(storedAccount, onSessionChange) {
    return __awaiter(this, void 0, void 0, function () {
        var agent, gates, moderation, prevSession, aa;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    agent = new BskyAppAgent({ service: storedAccount.service });
                    if (storedAccount.pdsUrl) {
                        agent.sessionManager.pdsUrl = new URL(storedAccount.pdsUrl);
                    }
                    gates = features.refresh({
                        strategy: 'prefer-low-latency',
                    });
                    moderation = configureModerationForAccount(agent, storedAccount);
                    prevSession = sessionAccountToSession(storedAccount);
                    if (!isSessionExpired(storedAccount)) return [3 /*break*/, 2];
                    return [4 /*yield*/, networkRetry(1, function () { return agent.resumeSession(prevSession); })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    agent.sessionManager.session = prevSession;
                    if (!storedAccount.signupQueued) {
                        networkRetry(3, function () { return agent.resumeSession(prevSession); }).catch(function (e) {
                            logger.error("networkRetry failed to resume session", {
                                status: (e === null || e === void 0 ? void 0 : e.status) || 'unknown',
                                // this field name is ignored by Sentry scrubbers
                                safeMessage: (e === null || e === void 0 ? void 0 : e.message) || 'unknown',
                            });
                            throw e;
                        });
                    }
                    _a.label = 3;
                case 3:
                    aa = prefetchAgeAssuranceData({ agent: agent });
                    agent.configureProxy(BLUESKY_PROXY_HEADER.get());
                    return [2 /*return*/, agent.prepare({
                            resolvers: [gates, moderation, aa],
                            onSessionChange: onSessionChange,
                        })];
            }
        });
    });
}
export function createAgentAndLogin(_a, onSessionChange_1) {
    return __awaiter(this, arguments, void 0, function (_b, onSessionChange) {
        var agent, account, gates, moderation, aa;
        var service = _b.service, identifier = _b.identifier, password = _b.password, authFactorToken = _b.authFactorToken;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    agent = new BskyAppAgent({ service: service });
                    return [4 /*yield*/, agent.login({
                            identifier: identifier,
                            password: password,
                            authFactorToken: authFactorToken,
                            allowTakendown: true,
                        })];
                case 1:
                    _c.sent();
                    account = agentToSessionAccountOrThrow(agent);
                    gates = features.refresh({ strategy: 'prefer-fresh-gates' });
                    moderation = configureModerationForAccount(agent, account);
                    aa = prefetchAgeAssuranceData({ agent: agent });
                    agent.configureProxy(BLUESKY_PROXY_HEADER.get());
                    return [2 /*return*/, agent.prepare({
                            resolvers: [gates, moderation, aa],
                            onSessionChange: onSessionChange,
                        })];
            }
        });
    });
}
export function createAgentAndCreateAccount(_a, onSessionChange_1) {
    return __awaiter(this, arguments, void 0, function (_b, onSessionChange) {
        var agent, account, gates, moderation, createdAt, birthdate, aa;
        var service = _b.service, email = _b.email, password = _b.password, handle = _b.handle, birthDate = _b.birthDate, inviteCode = _b.inviteCode, verificationPhone = _b.verificationPhone, verificationCode = _b.verificationCode;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    agent = new BskyAppAgent({ service: service });
                    return [4 /*yield*/, agent.createAccount({
                            email: email,
                            password: password,
                            handle: handle,
                            inviteCode: inviteCode,
                            verificationPhone: verificationPhone,
                            verificationCode: verificationCode,
                        })];
                case 1:
                    _c.sent();
                    account = agentToSessionAccountOrThrow(agent);
                    gates = features.refresh({ strategy: 'prefer-fresh-gates' });
                    moderation = configureModerationForAccount(agent, account);
                    createdAt = new Date().toISOString();
                    birthdate = birthDate.toISOString();
                    /*
                     * Since we have a race with account creation, profile creation, and AA
                     * state, set these values locally to ensure sync reads. Values are written
                     * to the server in the next step, so on subsequent reloads, the server will
                     * be the source of truth.
                     */
                    setCreatedAtForDid({ did: account.did, createdAt: createdAt });
                    setBirthdateForDid({ did: account.did, birthdate: birthdate });
                    snoozeBirthdateUpdateAllowedForDid(account.did);
                    aa = prefetchAgeAssuranceData({ agent: agent });
                    // Not awaited so that we can still get into onboarding.
                    // This is OK because we won't let you toggle adult stuff until you set the date.
                    if (IS_PROD_SERVICE(service)) {
                        Promise.allSettled([
                            networkRetry(3, function () {
                                return agent.setPersonalDetails({
                                    birthDate: birthdate,
                                });
                            }).catch(function (e) {
                                logger.info("createAgentAndCreateAccount: failed to set birthDate");
                                throw e;
                            }),
                            networkRetry(3, function () {
                                return agent.upsertProfile(function (prev) {
                                    var next = prev || {};
                                    next.displayName = handle;
                                    next.createdAt = createdAt;
                                    return next;
                                });
                            }).catch(function (e) {
                                logger.info("createAgentAndCreateAccount: failed to set initial profile");
                                throw e;
                            }),
                            networkRetry(1, function () {
                                return agent.overwriteSavedFeeds([
                                    __assign(__assign({}, DISCOVER_SAVED_FEED), { id: TID.nextStr() }),
                                    __assign(__assign({}, TIMELINE_SAVED_FEED), { id: TID.nextStr() }),
                                ]);
                            }).catch(function (e) {
                                logger.info("createAgentAndCreateAccount: failed to set initial feeds");
                                throw e;
                            }),
                            getAge(birthDate) < 18 &&
                                networkRetry(3, function () {
                                    return agent.com.atproto.repo.putRecord({
                                        repo: account.did,
                                        collection: 'chat.bsky.actor.declaration',
                                        rkey: 'self',
                                        record: {
                                            $type: 'chat.bsky.actor.declaration',
                                            allowIncoming: 'none',
                                        },
                                    });
                                }).catch(function (e) {
                                    logger.info("createAgentAndCreateAccount: failed to set chat declaration");
                                    throw e;
                                }),
                        ].filter(Boolean)).then(function (promises) {
                            var rejected = promises.filter(function (p) { return p.status === 'rejected'; });
                            if (rejected.length > 0) {
                                logger.error("session: createAgentAndCreateAccount failed to save personal details and feeds");
                            }
                        });
                    }
                    else {
                        Promise.allSettled([
                            networkRetry(3, function () {
                                return agent.setPersonalDetails({
                                    birthDate: birthDate.toISOString(),
                                });
                            }).catch(function (e) {
                                logger.info("createAgentAndCreateAccount: failed to set birthDate");
                                throw e;
                            }),
                            networkRetry(3, function () {
                                return agent.upsertProfile(function (prev) {
                                    var next = prev || {};
                                    next.createdAt = (prev === null || prev === void 0 ? void 0 : prev.createdAt) || new Date().toISOString();
                                    return next;
                                });
                            }).catch(function (e) {
                                logger.info("createAgentAndCreateAccount: failed to set initial profile");
                                throw e;
                            }),
                        ].filter(Boolean)).then(function (promises) {
                            var rejected = promises.filter(function (p) { return p.status === 'rejected'; });
                            if (rejected.length > 0) {
                                logger.error("session: createAgentAndCreateAccount failed to save personal details and feeds");
                            }
                        });
                    }
                    try {
                        // snooze first prompt after signup, defer to next prompt
                        snoozeEmailConfirmationPrompt();
                    }
                    catch (e) {
                        logger.error(e, { message: "session: failed snoozeEmailConfirmationPrompt" });
                    }
                    agent.configureProxy(BLUESKY_PROXY_HEADER.get());
                    return [2 /*return*/, agent.prepare({
                            resolvers: [gates, moderation, aa],
                            onSessionChange: onSessionChange,
                        })];
            }
        });
    });
}
export function agentToSessionAccountOrThrow(agent) {
    var account = agentToSessionAccount(agent);
    if (!account) {
        throw Error('Expected an active session');
    }
    return account;
}
export function agentToSessionAccount(agent) {
    var _a;
    if (!agent.session) {
        return undefined;
    }
    return {
        service: agent.serviceUrl.toString(),
        did: agent.session.did,
        handle: agent.session.handle,
        email: agent.session.email,
        emailConfirmed: agent.session.emailConfirmed || false,
        emailAuthFactor: agent.session.emailAuthFactor || false,
        refreshJwt: agent.session.refreshJwt,
        accessJwt: agent.session.accessJwt,
        signupQueued: isSignupQueued(agent.session.accessJwt),
        active: agent.session.active,
        status: agent.session.status,
        pdsUrl: (_a = agent.pdsUrl) === null || _a === void 0 ? void 0 : _a.toString(),
        isSelfHosted: !agent.serviceUrl.toString().startsWith(BSKY_SERVICE),
    };
}
export function sessionAccountToSession(account) {
    var _a, _b, _c;
    return {
        // Sorted in the same property order as when returned by BskyAgent (alphabetical).
        accessJwt: (_a = account.accessJwt) !== null && _a !== void 0 ? _a : '',
        did: account.did,
        email: account.email,
        emailAuthFactor: account.emailAuthFactor,
        emailConfirmed: account.emailConfirmed,
        handle: account.handle,
        refreshJwt: (_b = account.refreshJwt) !== null && _b !== void 0 ? _b : '',
        /**
         * @see https://github.com/bluesky-social/atproto/blob/c5d36d5ba2a2c2a5c4f366a5621c06a5608e361e/packages/api/src/agent.ts#L188
         */
        active: (_c = account.active) !== null && _c !== void 0 ? _c : true,
        status: account.status,
    };
}
var Agent = /** @class */ (function (_super) {
    __extends(Agent, _super);
    function Agent(proxyHeader, options) {
        var _this = _super.call(this, options) || this;
        if (proxyHeader) {
            _this.configureProxy(proxyHeader);
        }
        return _this;
    }
    return Agent;
}(BaseAgent));
export { Agent };
// Not exported. Use factories above to create it.
// WARN: In the factories above, we _manually set a proxy header_ for the agent after we do whatever it is we are supposed to do.
// Ideally, we wouldn't be doing this. However, since there is so much logic that requires making calls to the PDS right now, it
// feels safer to just let those run as-is and set the header afterward.
var realFetch = globalThis.fetch;
var BskyAppAgent = /** @class */ (function (_super) {
    __extends(BskyAppAgent, _super);
    function BskyAppAgent(_a) {
        var service = _a.service;
        var _this = _super.call(this, {
            service: service,
            fetch: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return __awaiter(this, void 0, void 0, function () {
                    var success, result, e_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                success = false;
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, 4, 5]);
                                return [4 /*yield*/, realFetch.apply(void 0, args)];
                            case 2:
                                result = _a.sent();
                                success = true;
                                return [2 /*return*/, result];
                            case 3:
                                e_1 = _a.sent();
                                success = false;
                                throw e_1;
                            case 4:
                                if (success) {
                                    emitNetworkConfirmed();
                                }
                                else {
                                    emitNetworkLost();
                                }
                                return [7 /*endfinally*/];
                            case 5: return [2 /*return*/];
                        }
                    });
                });
            },
            persistSession: function (event) {
                if (_this.persistSessionHandler) {
                    _this.persistSessionHandler(event);
                }
            },
        }) || this;
        _this.persistSessionHandler = undefined;
        return _this;
    }
    BskyAppAgent.prototype.prepare = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var account;
            var _this = this;
            var resolvers = _b.resolvers, onSessionChange = _b.onSessionChange;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: 
                    // There's nothing else left to do, so block on them here.
                    return [4 /*yield*/, Promise.all(resolvers)
                        // Now the agent is ready.
                    ];
                    case 1:
                        // There's nothing else left to do, so block on them here.
                        _c.sent();
                        account = agentToSessionAccountOrThrow(this);
                        this.persistSessionHandler = function (event) {
                            onSessionChange(_this, account.did, event);
                            if (event !== 'create' && event !== 'update') {
                                addSessionErrorLog(account.did, event);
                            }
                        };
                        return [2 /*return*/, { account: account, agent: this }];
                }
            });
        });
    };
    BskyAppAgent.prototype.dispose = function () {
        this.sessionManager.session = undefined;
        this.persistSessionHandler = undefined;
    };
    return BskyAppAgent;
}(BskyAgent));
