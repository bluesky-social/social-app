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
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider, } from '@tanstack/react-query-persist-client';
import { listenNetworkConfirmed, listenNetworkLost } from '#/state/events';
import { IS_NATIVE, IS_WEB } from '#/env';
// any query keys in this array will be persisted to AsyncStorage
export var labelersDetailedInfoQueryKeyRoot = 'labelers-detailed-info';
var STORED_CACHE_QUERY_KEY_ROOTS = [labelersDetailedInfoQueryKeyRoot];
function checkIsOnline() {
    return __awaiter(this, void 0, void 0, function () {
        var controller_1, res, json, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    controller_1 = new AbortController();
                    setTimeout(function () {
                        controller_1.abort();
                    }, 15e3);
                    return [4 /*yield*/, fetch('https://public.api.bsky.app/xrpc/_health', {
                            cache: 'no-store',
                            signal: controller_1.signal,
                        })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    json = _a.sent();
                    if (json.version) {
                        return [2 /*return*/, true];
                    }
                    else {
                        return [2 /*return*/, false];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
var receivedNetworkLost = false;
var receivedNetworkConfirmed = false;
var isNetworkStateUnclear = false;
listenNetworkLost(function () {
    receivedNetworkLost = true;
    onlineManager.setOnline(false);
});
listenNetworkConfirmed(function () {
    receivedNetworkConfirmed = true;
    onlineManager.setOnline(true);
});
var checkPromise;
function checkIsOnlineIfNeeded() {
    if (checkPromise) {
        return;
    }
    receivedNetworkLost = false;
    receivedNetworkConfirmed = false;
    checkPromise = checkIsOnline().then(function (nextIsOnline) {
        checkPromise = undefined;
        if (nextIsOnline && receivedNetworkLost) {
            isNetworkStateUnclear = true;
        }
        if (!nextIsOnline && receivedNetworkConfirmed) {
            isNetworkStateUnclear = true;
        }
        if (!isNetworkStateUnclear) {
            onlineManager.setOnline(nextIsOnline);
        }
    });
}
setInterval(function () {
    if (AppState.currentState === 'active') {
        if (!onlineManager.isOnline() || isNetworkStateUnclear) {
            checkIsOnlineIfNeeded();
        }
    }
}, 2000);
focusManager.setEventListener(function (onFocus) {
    if (IS_NATIVE) {
        var subscription_1 = AppState.addEventListener('change', function (status) {
            focusManager.setFocused(status === 'active');
        });
        return function () { return subscription_1.remove(); };
    }
    else if (typeof window !== 'undefined' && window.addEventListener) {
        // these handlers are a bit redundant but focus catches when the browser window
        // is blurred/focused while visibilitychange seems to only handle when the
        // window minimizes (both of them catch tab changes)
        // there's no harm to redundant fires because refetchOnWindowFocus is only
        // used with queries that employ stale data times
        var handler_1 = function () { return onFocus(); };
        window.addEventListener('focus', handler_1, false);
        window.addEventListener('visibilitychange', handler_1, false);
        return function () {
            window.removeEventListener('visibilitychange', handler_1);
            window.removeEventListener('focus', handler_1);
        };
    }
});
var createQueryClient = function () {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // NOTE
                // refetchOnWindowFocus breaks some UIs (like feeds)
                // so we only selectively want to enable this
                // -prf
                refetchOnWindowFocus: false,
                // Structural sharing between responses makes it impossible to rely on
                // "first seen" timestamps on objects to determine if they're fresh.
                // Disable this optimization so that we can rely on "first seen" timestamps.
                structuralSharing: false,
                // We don't want to retry queries by default, because in most cases we
                // want to fail early and show a response to the user. There are
                // exceptions, and those can be made on a per-query basis. For others, we
                // should give users controls to retry.
                retry: false,
            },
        },
    });
};
var dehydrateOptions = {
    shouldDehydrateMutation: function (_) { return false; },
    shouldDehydrateQuery: function (query) {
        return STORED_CACHE_QUERY_KEY_ROOTS.includes(String(query.queryKey[0]));
    },
};
export function QueryProvider(_a) {
    var children = _a.children, currentDid = _a.currentDid;
    return (_jsx(QueryProviderInner
    // Enforce we never reuse cache between users.
    // These two props MUST stay in sync.
    , { currentDid: currentDid, children: children }, currentDid));
}
function QueryProviderInner(_a) {
    var children = _a.children, currentDid = _a.currentDid;
    var initialDid = useRef(currentDid);
    if (currentDid !== initialDid.current) {
        throw Error('Something is very wrong. Expected did to be stable due to key above.');
    }
    // We create the query client here so that it's scoped to a specific DID.
    // Do not move the query client creation outside of this component.
    var _b = useState(function () { return createQueryClient(); }), queryClient = _b[0], _setQueryClient = _b[1];
    var _c = useState(function () {
        var asyncPersister = createAsyncStoragePersister({
            storage: AsyncStorage,
            key: 'queryClient-' + (currentDid !== null && currentDid !== void 0 ? currentDid : 'logged-out'),
        });
        return {
            persister: asyncPersister,
            dehydrateOptions: dehydrateOptions,
        };
    }), persistOptions = _c[0], _setPersistOptions = _c[1];
    useEffect(function () {
        if (IS_WEB) {
            window.__TANSTACK_QUERY_CLIENT__ = queryClient;
        }
    }, [queryClient]);
    return (_jsx(PersistQueryClientProvider, { client: queryClient, persistOptions: persistOptions, children: children }));
}
