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
import { Platform } from 'react-native';
import { getLocales } from 'expo-localization';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { GIF_FEATURED, GIF_SEARCH } from '#/lib/constants';
import { logger } from '#/logger';
export var RQKEY_ROOT = 'gif-service';
export var RQKEY_FEATURED = [RQKEY_ROOT, 'featured'];
export var RQKEY_SEARCH = function (query) { return [RQKEY_ROOT, 'search', query]; };
var getTrendingGifs = createTenorApi(GIF_FEATURED);
var searchGifs = createTenorApi(GIF_SEARCH);
export function useFeaturedGifsQuery() {
    return useInfiniteQuery({
        queryKey: RQKEY_FEATURED,
        queryFn: function (_a) {
            var pageParam = _a.pageParam;
            return getTrendingGifs({ pos: pageParam });
        },
        initialPageParam: undefined,
        getNextPageParam: function (lastPage) { return lastPage.next; },
    });
}
export function useGifSearchQuery(query) {
    return useInfiniteQuery({
        queryKey: RQKEY_SEARCH(query),
        queryFn: function (_a) {
            var pageParam = _a.pageParam;
            return searchGifs({ q: query, pos: pageParam });
        },
        initialPageParam: undefined,
        getNextPageParam: function (lastPage) { return lastPage.next; },
        enabled: !!query,
        placeholderData: keepPreviousData,
    });
}
function createTenorApi(urlFn) {
    var _this = this;
    return function (input) { return __awaiter(_this, void 0, void 0, function () {
        var params, locale, _i, _a, _b, key, value, res;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    params = new URLSearchParams();
                    // set client key based on platform
                    params.set('client_key', Platform.select({
                        ios: 'bluesky-ios',
                        android: 'bluesky-android',
                        default: 'bluesky-web',
                    }));
                    // 30 is divisible by 2 and 3, so both 2 and 3 column layouts can be used
                    params.set('limit', '30');
                    params.set('contentfilter', 'high');
                    params.set('media_filter', ['preview', 'gif', 'tinygif'].join(','));
                    locale = (_c = getLocales === null || getLocales === void 0 ? void 0 : getLocales()) === null || _c === void 0 ? void 0 : _c[0];
                    if (locale) {
                        params.set('locale', locale.languageTag.replace('-', '_'));
                    }
                    for (_i = 0, _a = Object.entries(input); _i < _a.length; _i++) {
                        _b = _a[_i], key = _b[0], value = _b[1];
                        if (value !== undefined) {
                            params.set(key, String(value));
                        }
                    }
                    return [4 /*yield*/, fetch(urlFn(params.toString()), {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        })];
                case 1:
                    res = _d.sent();
                    if (!res.ok) {
                        throw new Error('Failed to fetch Tenor API');
                    }
                    return [2 /*return*/, res.json()];
            }
        });
    }); };
}
export function tenorUrlToBskyGifUrl(tenorUrl) {
    var url;
    try {
        url = new URL(tenorUrl);
    }
    catch (e) {
        logger.debug('invalid url passed to tenorUrlToBskyGifUrl()');
        return '';
    }
    url.hostname = 't.gifs.bsky.app';
    return url.href;
}
// | 'nanogif'
// | 'mp4'
// | 'loopedmp4'
// | 'tinymp4'
// | 'nanomp4'
// | 'webm'
// | 'tinywebm'
// | 'nanowebm'
