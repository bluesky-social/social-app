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
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { AtpAgent, getAgeAssuranceRegionConfig, } from '@atproto/api';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, QueryClient, useQuery } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import debounce from 'lodash.debounce';
import { networkRetry } from '#/lib/async/retry';
import { PUBLIC_BSKY_SERVICE } from '#/lib/constants';
import { createPersistedQueryStorage } from '#/lib/persisted-query-storage';
import { getAge } from '#/lib/strings/time';
import { hasSnoozedBirthdateUpdateForDid, snoozeBirthdateUpdateAllowedForDid, } from '#/state/birthdate';
import { useAgent, useSession } from '#/state/session';
import * as debug from '#/ageAssurance/debug';
import { logger } from '#/ageAssurance/logger';
import { getBirthdateStringFromAge, isLegacyBirthdateBug, } from '#/ageAssurance/util';
import { IS_DEV } from '#/env';
import { device } from '#/storage';
/**
 * Special query client for age assurance data so we can prefetch on app
 * load without interfering with other queries.
 */
var qc = new QueryClient({
    defaultOptions: {
        queries: {
            /**
             * We clear this manually, so disable automatic garbage collection.
             * @see https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient#how-it-works
             */
            gcTime: Infinity,
        },
    },
});
var persister = createAsyncStoragePersister({
    storage: createPersistedQueryStorage('age-assurance'),
    key: 'age-assurance-query-client',
});
var _a = persistQueryClient({
    queryClient: qc,
    persister: persister,
}), cacheHydrationPromise = _a[1];
function getDidFromAgentSession(agent) {
    var sessionManager = agent.sessionManager;
    if (!sessionManager || !sessionManager.did)
        return;
    return sessionManager.did;
}
/*
 * Optimistic data
 */
var createdAtCache = new Map();
export function setCreatedAtForDid(_a) {
    var did = _a.did, createdAt = _a.createdAt;
    createdAtCache.set(did, createdAt);
}
var birthdateCache = new Map();
export function setBirthdateForDid(_a) {
    var did = _a.did, birthdate = _a.birthdate;
    birthdateCache.set(did, birthdate);
}
/*
 * Config
 */
export var configQueryKey = ['config'];
export function getConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var agent, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (debug.enabled)
                        return [2 /*return*/, debug.resolve(debug.config)];
                    agent = new AtpAgent({
                        service: PUBLIC_BSKY_SERVICE,
                    });
                    return [4 /*yield*/, agent.app.bsky.ageassurance.getConfig()];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.data];
            }
        });
    });
}
export function getConfigFromCache() {
    return qc.getQueryData(configQueryKey);
}
var configPrefetchPromise;
export function prefetchConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            if (configPrefetchPromise) {
                logger.debug("prefetchAgeAssuranceConfig: already in progress");
                return [2 /*return*/];
            }
            configPrefetchPromise = new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                var cached, res, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, cacheHydrationPromise];
                        case 1:
                            _a.sent();
                            cached = getConfigFromCache();
                            if (!cached) return [3 /*break*/, 2];
                            logger.debug("prefetchAgeAssuranceConfig: using cache");
                            resolve();
                            return [3 /*break*/, 6];
                        case 2:
                            _a.trys.push([2, 4, 5, 6]);
                            logger.debug("prefetchAgeAssuranceConfig: resolving...");
                            return [4 /*yield*/, networkRetry(3, function () { return getConfig(); })];
                        case 3:
                            res = _a.sent();
                            qc.setQueryData(configQueryKey, res);
                            return [3 /*break*/, 6];
                        case 4:
                            e_1 = _a.sent();
                            logger.warn("prefetchAgeAssuranceConfig: failed", {
                                safeMessage: e_1.message,
                            });
                            return [3 /*break*/, 6];
                        case 5:
                            resolve();
                            return [7 /*endfinally*/];
                        case 6: return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    });
}
export function refetchConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.debug("refetchConfig: fetching...");
                    return [4 /*yield*/, getConfig()];
                case 1:
                    res = _a.sent();
                    qc.setQueryData(configQueryKey, res);
                    return [2 /*return*/, res];
            }
        });
    });
}
export function useConfigQuery() {
    return useQuery({
        /**
         * Will re-fetch when stale, at most every hour (or 5s in dev for easier
         * testing).
         *
         * @see https://tanstack.com/query/latest/docs/framework/react/guides/initial-query-data#initial-data-from-the-cache-with-initialdataupdatedat
         */
        staleTime: IS_DEV ? 5e3 : 1000 * 60 * 60,
        /**
         * N.B. if prefetch failed above, we'll have no `initialData`, and this
         * query will run on startup.
         */
        initialData: getConfigFromCache(),
        initialDataUpdatedAt: function () { var _a; return (_a = qc.getQueryState(configQueryKey)) === null || _a === void 0 ? void 0 : _a.dataUpdatedAt; },
        queryKey: configQueryKey,
        queryFn: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    logger.debug("useConfigQuery: fetching config");
                    return [2 /*return*/, getConfig()];
                });
            });
        },
    }, qc);
}
/*
 * Server state
 */
export function createServerStateQueryKey(_a) {
    var did = _a.did;
    return ['serverState', did];
}
export function getServerState(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var geolocation, data, did;
        var agent = _b.agent;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (debug.enabled && debug.serverState)
                        return [2 /*return*/, debug.resolve(debug.serverState)];
                    geolocation = device.get(['mergedGeolocation']);
                    if (!geolocation || !geolocation.countryCode) {
                        logger.error("getServerState: missing geolocation countryCode");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, agent.app.bsky.ageassurance.getState({
                            countryCode: geolocation.countryCode,
                            regionCode: geolocation.regionCode,
                        })];
                case 1:
                    data = (_c.sent()).data;
                    did = getDidFromAgentSession(agent);
                    if (data && did && createdAtCache.has(did)) {
                        /*
                         * If account was just created, just use the local cache if available. On
                         * subsequent reloads, the server should have the correct value.
                         */
                        data.metadata.accountCreatedAt = createdAtCache.get(did);
                    }
                    return [2 /*return*/, data !== null && data !== void 0 ? data : null];
            }
        });
    });
}
export function getServerStateFromCache(_a) {
    var did = _a.did;
    return qc.getQueryData(createServerStateQueryKey({ did: did }));
}
export function prefetchServerState(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var did, qk, cached, res, e_2;
        var agent = _b.agent;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    did = getDidFromAgentSession(agent);
                    if (!did)
                        return [2 /*return*/];
                    return [4 /*yield*/, cacheHydrationPromise];
                case 1:
                    _c.sent();
                    qk = createServerStateQueryKey({ did: did });
                    cached = getServerStateFromCache({ did: did });
                    if (cached) {
                        logger.debug("prefetchServerState: using cache");
                        return [2 /*return*/];
                    }
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 5]);
                    logger.debug("prefetchServerState: resolving...");
                    return [4 /*yield*/, networkRetry(3, function () { return getServerState({ agent: agent }); })];
                case 3:
                    res = _c.sent();
                    qc.setQueryData(qk, res);
                    return [3 /*break*/, 5];
                case 4:
                    e_2 = _c.sent();
                    logger.warn("prefetchServerState: failed", {
                        safeMessage: e_2.message,
                    });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
export function refetchServerState(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var did, res;
        var agent = _b.agent;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    did = getDidFromAgentSession(agent);
                    if (!did)
                        return [2 /*return*/];
                    logger.debug("refetchServerState: fetching...");
                    return [4 /*yield*/, networkRetry(3, function () { return getServerState({ agent: agent }); })];
                case 1:
                    res = _c.sent();
                    qc.setQueryData(createServerStateQueryKey({ did: did }), res);
                    return [2 /*return*/, res];
            }
        });
    });
}
export function usePatchServerState() {
    var _this = this;
    var currentAccount = useSession().currentAccount;
    return useCallback(function (next) { return __awaiter(_this, void 0, void 0, function () {
        var did, prev, merged;
        return __generator(this, function (_a) {
            if (!currentAccount)
                return [2 /*return*/];
            did = currentAccount.did;
            prev = getServerStateFromCache({ did: did });
            merged = __assign(__assign({ metadata: {} }, (prev || {})), { state: next });
            qc.setQueryData(createServerStateQueryKey({ did: did }), merged);
            return [2 /*return*/];
        });
    }); }, [currentAccount]);
}
export function useServerStateQuery() {
    var _a, _b;
    var agent = useAgent();
    var did = getDidFromAgentSession(agent);
    var query = useQuery({
        enabled: !!did,
        initialData: function () {
            if (!did)
                return;
            return getServerStateFromCache({ did: did });
        },
        queryKey: createServerStateQueryKey({ did: did }),
        queryFn: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, getServerState({ agent: agent })];
                });
            });
        },
    }, qc);
    var refetch = useMemo(function () { return debounce(query.refetch, 100); }, [query.refetch]);
    var isAssured = ((_b = (_a = query.data) === null || _a === void 0 ? void 0 : _a.state) === null || _b === void 0 ? void 0 : _b.status) === 'assured';
    /**
     * `refetchOnWindowFocus` doesn't seem to want to work for this custom query
     * client, so we manually subscribe to focus changes.
     */
    useEffect(function () {
        return focusManager.subscribe(function () {
            var _a;
            // logged out
            if (!did)
                return;
            var isFocused = focusManager.isFocused();
            if (!isFocused)
                return;
            var config = getConfigFromCache();
            var geolocation = device.get(['mergedGeolocation']);
            var isAArequired = Boolean(config &&
                geolocation &&
                !!getAgeAssuranceRegionConfig(config, {
                    countryCode: (_a = geolocation === null || geolocation === void 0 ? void 0 : geolocation.countryCode) !== null && _a !== void 0 ? _a : '',
                    regionCode: geolocation === null || geolocation === void 0 ? void 0 : geolocation.regionCode,
                }));
            // only refetch when needed
            if (isAssured || !isAArequired)
                return;
            refetch();
        });
    }, [did, refetch, isAssured]);
    return query;
}
export function createOtherRequiredDataQueryKey(_a) {
    var did = _a.did;
    return ['otherRequiredData', did];
}
export function getOtherRequiredData(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var prefs, data, did;
        var _c, _d, _e;
        var agent = _b.agent;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (debug.enabled)
                        return [2 /*return*/, debug.resolve(debug.otherRequiredData)];
                    return [4 /*yield*/, Promise.all([agent.getPreferences()])];
                case 1:
                    prefs = (_f.sent())[0];
                    data = {
                        birthdate: prefs.birthDate ? prefs.birthDate.toISOString() : undefined,
                    };
                    /**
                     * If we can't read a birthdate, it may be due to the user accessing the
                     * account via an app password. In that case, fall-back to declared age
                     * flags.
                     */
                    if (!data.birthdate) {
                        if ((_c = prefs.declaredAge) === null || _c === void 0 ? void 0 : _c.isOverAge18) {
                            data.birthdate = getBirthdateStringFromAge(18);
                        }
                        else if ((_d = prefs.declaredAge) === null || _d === void 0 ? void 0 : _d.isOverAge16) {
                            data.birthdate = getBirthdateStringFromAge(16);
                        }
                        else if ((_e = prefs.declaredAge) === null || _e === void 0 ? void 0 : _e.isOverAge13) {
                            data.birthdate = getBirthdateStringFromAge(13);
                        }
                    }
                    did = getDidFromAgentSession(agent);
                    if (data && did && birthdateCache.has(did)) {
                        /*
                         * If birthdate was just set, use the local cache value. On subsequent
                         * reloads, the server should have the correct value.
                         */
                        data.birthdate = birthdateCache.get(did);
                    }
                    /**
                     * If the user is under the minimum age, and the birthdate is not due to the
                     * legacy bug, AND we've not already snoozed their birthdate update, snooze
                     * further birthdate updates for this user.
                     *
                     * This is basically a migration step for this initial rollout.
                     */
                    if (data.birthdate &&
                        !isLegacyBirthdateBug(data.birthdate) &&
                        !hasSnoozedBirthdateUpdateForDid(did)) {
                        snoozeBirthdateUpdateAllowedForDid(did);
                    }
                    return [2 /*return*/, data];
            }
        });
    });
}
export function getOtherRequiredDataFromCache(_a) {
    var did = _a.did;
    return qc.getQueryData(createOtherRequiredDataQueryKey({ did: did }));
}
export function prefetchOtherRequiredData(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var did, qk, cached, res, e_3;
        var agent = _b.agent;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    did = getDidFromAgentSession(agent);
                    if (!did)
                        return [2 /*return*/];
                    return [4 /*yield*/, cacheHydrationPromise];
                case 1:
                    _c.sent();
                    qk = createOtherRequiredDataQueryKey({ did: did });
                    cached = getOtherRequiredDataFromCache({ did: did });
                    if (cached) {
                        logger.debug("prefetchOtherRequiredData: using cache");
                        return [2 /*return*/];
                    }
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 5]);
                    logger.debug("prefetchOtherRequiredData: resolving...");
                    return [4 /*yield*/, networkRetry(3, function () { return getOtherRequiredData({ agent: agent }); })];
                case 3:
                    res = _c.sent();
                    qc.setQueryData(qk, res);
                    return [3 /*break*/, 5];
                case 4:
                    e_3 = _c.sent();
                    logger.warn("prefetchOtherRequiredData: failed", {
                        safeMessage: e_3.message,
                    });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
export function usePatchOtherRequiredData() {
    var _this = this;
    var currentAccount = useSession().currentAccount;
    return useCallback(function (next) { return __awaiter(_this, void 0, void 0, function () {
        var did, prev, merged;
        return __generator(this, function (_a) {
            if (!currentAccount)
                return [2 /*return*/];
            did = currentAccount.did;
            prev = getOtherRequiredDataFromCache({ did: did });
            merged = __assign(__assign({}, (prev || {})), next);
            qc.setQueryData(createOtherRequiredDataQueryKey({ did: did }), merged);
            return [2 /*return*/];
        });
    }); }, [currentAccount]);
}
export function useOtherRequiredDataQuery() {
    var agent = useAgent();
    var did = getDidFromAgentSession(agent);
    return useQuery({
        enabled: !!did,
        initialData: function () {
            if (!did)
                return;
            return getOtherRequiredDataFromCache({ did: did });
        },
        queryKey: createOtherRequiredDataQueryKey({ did: did }),
        queryFn: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, getOtherRequiredData({ agent: agent })];
                });
            });
        },
    }, qc);
}
/**
 * Helper to prefetch all age assurance data.
 */
export function prefetchAgeAssuranceData(_a) {
    var agent = _a.agent;
    return Promise.allSettled([
        // config fetch initiated at the top of the App.platform.tsx files, awaited here
        configPrefetchPromise,
        prefetchServerState({ agent: agent }),
        prefetchOtherRequiredData({ agent: agent }),
    ]);
}
export function clearAgeAssuranceDataForDid(_a) {
    var did = _a.did;
    logger.debug("clearAgeAssuranceDataForDid: ".concat(did));
    qc.removeQueries({ queryKey: createServerStateQueryKey({ did: did }), exact: true });
    qc.removeQueries({
        queryKey: createOtherRequiredDataQueryKey({ did: did }),
        exact: true,
    });
}
export function clearAgeAssuranceData() {
    logger.debug("clearAgeAssuranceData");
    qc.clear();
}
export var AgeAssuranceDataContext = createContext({
    config: undefined,
    state: undefined,
    data: {
        accountCreatedAt: undefined,
        declaredAge: undefined,
        birthdate: undefined,
    },
});
export function useAgeAssuranceDataContext() {
    return useContext(AgeAssuranceDataContext);
}
export function AgeAssuranceDataProvider(_a) {
    var children = _a.children;
    var config = useConfigQuery().data;
    var serverState = useServerStateQuery();
    var _b = serverState.data || {}, state = _b.state, metadata = _b.metadata;
    var data = useOtherRequiredDataQuery().data;
    var ctx = useMemo(function () { return ({
        config: config,
        state: state,
        data: {
            accountCreatedAt: metadata === null || metadata === void 0 ? void 0 : metadata.accountCreatedAt,
            declaredAge: (data === null || data === void 0 ? void 0 : data.birthdate)
                ? getAge(new Date(data.birthdate))
                : undefined,
            birthdate: data === null || data === void 0 ? void 0 : data.birthdate,
        },
    }); }, [config, state, data, metadata]);
    return (_jsx(AgeAssuranceDataContext.Provider, { value: ctx, children: children }));
}
