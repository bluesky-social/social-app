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
import { AppBskyFeedDefs, AppBskyGraphDefs, AppBskyGraphStarterpack, AtUri, RichText, } from '@atproto/api';
import { useMutation, useQuery, useQueryClient, } from '@tanstack/react-query';
import chunk from 'lodash.chunk';
import { until } from '#/lib/async/until';
import { createStarterPackList } from '#/lib/generate-starterpack';
import { createStarterPackUri, httpStarterPackUriToAtUri, parseStarterPackUri, } from '#/lib/strings/starter-pack';
import { invalidateActorStarterPacksQuery } from '#/state/queries/actor-starter-packs';
import { STALE } from '#/state/queries/index';
import { invalidateListMembersQuery } from '#/state/queries/list-members';
import { useAgent } from '#/state/session';
import * as bsky from '#/types/bsky';
var RQKEY_ROOT = 'starter-pack';
var RQKEY = function (_a) {
    var uri = _a.uri, did = _a.did, rkey = _a.rkey;
    if ((uri === null || uri === void 0 ? void 0 : uri.startsWith('https://')) || (uri === null || uri === void 0 ? void 0 : uri.startsWith('at://'))) {
        var parsed = parseStarterPackUri(uri);
        return [RQKEY_ROOT, parsed === null || parsed === void 0 ? void 0 : parsed.name, parsed === null || parsed === void 0 ? void 0 : parsed.rkey];
    }
    else {
        return [RQKEY_ROOT, did, rkey];
    }
};
export function useStarterPackQuery(_a) {
    var _this = this;
    var uri = _a.uri, did = _a.did, rkey = _a.rkey;
    var agent = useAgent();
    return useQuery({
        queryKey: RQKEY(uri ? { uri: uri } : { did: did, rkey: rkey }),
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!uri) {
                            uri = "at://".concat(did, "/app.bsky.graph.starterpack/").concat(rkey);
                        }
                        else if (uri && !uri.startsWith('at://')) {
                            uri = httpStarterPackUriToAtUri(uri);
                        }
                        return [4 /*yield*/, agent.app.bsky.graph.getStarterPack({
                                starterPack: uri,
                            })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data.starterPack];
                }
            });
        }); },
        enabled: Boolean(uri) || Boolean(did && rkey),
        staleTime: STALE.MINUTES.FIVE,
    });
}
export function invalidateStarterPack(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var queryClient = _b.queryClient, did = _b.did, rkey = _b.rkey;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: RQKEY({ did: did, rkey: rkey }) })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function useCreateStarterPackMutation(_a) {
    var _this = this;
    var onSuccess = _a.onSuccess, onError = _a.onError;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var descriptionFacets, rt, listRes;
            var name = _b.name, description = _b.description, feeds = _b.feeds, profiles = _b.profiles;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!description) return [3 /*break*/, 2];
                        rt = new RichText({ text: description });
                        return [4 /*yield*/, rt.detectFacets(agent)];
                    case 1:
                        _c.sent();
                        descriptionFacets = rt.facets;
                        _c.label = 2;
                    case 2: return [4 /*yield*/, createStarterPackList({
                            name: name,
                            description: description,
                            profiles: profiles,
                            descriptionFacets: descriptionFacets,
                            agent: agent,
                        })];
                    case 3:
                        listRes = _c.sent();
                        return [4 /*yield*/, agent.app.bsky.graph.starterpack.create({
                                repo: agent.assertDid,
                            }, {
                                name: name,
                                description: description,
                                descriptionFacets: descriptionFacets,
                                list: listRes === null || listRes === void 0 ? void 0 : listRes.uri,
                                feeds: feeds === null || feeds === void 0 ? void 0 : feeds.map(function (f) { return ({ uri: f.uri }); }),
                                createdAt: new Date().toISOString(),
                            })];
                    case 4: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
        onSuccess: function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, whenAppViewReady(agent, data.uri, function (v) {
                            return typeof (v === null || v === void 0 ? void 0 : v.data.starterPack.uri) === 'string';
                        })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, invalidateActorStarterPacksQuery({
                                queryClient: queryClient,
                                did: agent.session.did,
                            })];
                    case 2:
                        _a.sent();
                        onSuccess(data);
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                onError(error);
                return [2 /*return*/];
            });
        }); },
    });
}
export function useEditStarterPackMutation(_a) {
    var _this = this;
    var onSuccess = _a.onSuccess, onError = _a.onError;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var descriptionFacets, rt, removedItems, chunks, _i, chunks_1, chunk_1, addedProfiles, chunks, _c, chunks_2, chunk_2, rkey;
            var _d;
            var name = _b.name, description = _b.description, feeds = _b.feeds, profiles = _b.profiles, currentStarterPack = _b.currentStarterPack, currentListItems = _b.currentListItems;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!description) return [3 /*break*/, 2];
                        rt = new RichText({ text: description });
                        return [4 /*yield*/, rt.detectFacets(agent)];
                    case 1:
                        _e.sent();
                        descriptionFacets = rt.facets;
                        _e.label = 2;
                    case 2:
                        if (!AppBskyGraphStarterpack.isRecord(currentStarterPack.record)) {
                            throw new Error('Invalid starter pack');
                        }
                        removedItems = currentListItems.filter(function (i) {
                            var _a;
                            return i.subject.did !== ((_a = agent.session) === null || _a === void 0 ? void 0 : _a.did) &&
                                !profiles.find(function (p) { return p.did === i.subject.did && p.did; });
                        });
                        if (!(removedItems.length !== 0)) return [3 /*break*/, 6];
                        chunks = chunk(removedItems, 50);
                        _i = 0, chunks_1 = chunks;
                        _e.label = 3;
                    case 3:
                        if (!(_i < chunks_1.length)) return [3 /*break*/, 6];
                        chunk_1 = chunks_1[_i];
                        return [4 /*yield*/, agent.com.atproto.repo.applyWrites({
                                repo: agent.session.did,
                                writes: chunk_1.map(function (i) { return ({
                                    $type: 'com.atproto.repo.applyWrites#delete',
                                    collection: 'app.bsky.graph.listitem',
                                    rkey: new AtUri(i.uri).rkey,
                                }); }),
                            })];
                    case 4:
                        _e.sent();
                        _e.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        addedProfiles = profiles.filter(function (p) { return !currentListItems.find(function (i) { return i.subject.did === p.did; }); });
                        if (!(addedProfiles.length > 0)) return [3 /*break*/, 10];
                        chunks = chunk(addedProfiles, 50);
                        _c = 0, chunks_2 = chunks;
                        _e.label = 7;
                    case 7:
                        if (!(_c < chunks_2.length)) return [3 /*break*/, 10];
                        chunk_2 = chunks_2[_c];
                        return [4 /*yield*/, agent.com.atproto.repo.applyWrites({
                                repo: agent.session.did,
                                writes: chunk_2.map(function (p) {
                                    var _a;
                                    return ({
                                        $type: 'com.atproto.repo.applyWrites#create',
                                        collection: 'app.bsky.graph.listitem',
                                        value: {
                                            $type: 'app.bsky.graph.listitem',
                                            subject: p.did,
                                            list: (_a = currentStarterPack.list) === null || _a === void 0 ? void 0 : _a.uri,
                                            createdAt: new Date().toISOString(),
                                        },
                                    });
                                }),
                            })];
                    case 8:
                        _e.sent();
                        _e.label = 9;
                    case 9:
                        _c++;
                        return [3 /*break*/, 7];
                    case 10:
                        rkey = parseStarterPackUri(currentStarterPack.uri).rkey;
                        return [4 /*yield*/, agent.com.atproto.repo.putRecord({
                                repo: agent.session.did,
                                collection: 'app.bsky.graph.starterpack',
                                rkey: rkey,
                                record: {
                                    name: name,
                                    description: description,
                                    descriptionFacets: descriptionFacets,
                                    list: (_d = currentStarterPack.list) === null || _d === void 0 ? void 0 : _d.uri,
                                    feeds: feeds,
                                    createdAt: currentStarterPack.record.createdAt,
                                    updatedAt: new Date().toISOString(),
                                },
                            })];
                    case 11:
                        _e.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
            var parsed;
            var currentStarterPack = _b.currentStarterPack;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        parsed = parseStarterPackUri(currentStarterPack.uri);
                        return [4 /*yield*/, whenAppViewReady(agent, currentStarterPack.uri, function (v) {
                                return currentStarterPack.cid !== (v === null || v === void 0 ? void 0 : v.data.starterPack.cid);
                            })];
                    case 1:
                        _c.sent();
                        return [4 /*yield*/, invalidateActorStarterPacksQuery({
                                queryClient: queryClient,
                                did: agent.session.did,
                            })];
                    case 2:
                        _c.sent();
                        if (!currentStarterPack.list) return [3 /*break*/, 4];
                        return [4 /*yield*/, invalidateListMembersQuery({
                                queryClient: queryClient,
                                uri: currentStarterPack.list.uri,
                            })];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4: return [4 /*yield*/, invalidateStarterPack({
                            queryClient: queryClient,
                            did: agent.session.did,
                            rkey: parsed.rkey,
                        })];
                    case 5:
                        _c.sent();
                        onSuccess();
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            onError(error);
        },
    });
}
export function useDeleteStarterPackMutation(_a) {
    var _this = this;
    var onSuccess = _a.onSuccess, onError = _a.onError;
    var agent = useAgent();
    var queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var listUri = _b.listUri, rkey = _b.rkey;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!agent.session) {
                            throw new Error("Requires signed in user");
                        }
                        if (!listUri) return [3 /*break*/, 2];
                        return [4 /*yield*/, agent.app.bsky.graph.list.delete({
                                repo: agent.session.did,
                                rkey: new AtUri(listUri).rkey,
                            })];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2: return [4 /*yield*/, agent.app.bsky.graph.starterpack.delete({
                            repo: agent.session.did,
                            rkey: rkey,
                        })];
                    case 3:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
            var uri;
            var listUri = _b.listUri, rkey = _b.rkey;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        uri = createStarterPackUri({
                            did: agent.session.did,
                            rkey: rkey,
                        });
                        if (!uri) return [3 /*break*/, 2];
                        return [4 /*yield*/, whenAppViewReady(agent, uri, function (v) {
                                var _a;
                                return Boolean((_a = v === null || v === void 0 ? void 0 : v.data) === null || _a === void 0 ? void 0 : _a.starterPack) === false;
                            })];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2:
                        if (!listUri) return [3 /*break*/, 4];
                        return [4 /*yield*/, invalidateListMembersQuery({ queryClient: queryClient, uri: listUri })];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4: return [4 /*yield*/, invalidateActorStarterPacksQuery({
                            queryClient: queryClient,
                            did: agent.session.did,
                        })];
                    case 5:
                        _c.sent();
                        return [4 /*yield*/, invalidateStarterPack({
                                queryClient: queryClient,
                                did: agent.session.did,
                                rkey: rkey,
                            })];
                    case 6:
                        _c.sent();
                        onSuccess();
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            onError(error);
        },
    });
}
function whenAppViewReady(agent, uri, fn) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, until(5, // 5 tries
                    1e3, // 1s delay between tries
                    fn, function () { return agent.app.bsky.graph.getStarterPack({ starterPack: uri }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function precacheStarterPack(queryClient, starterPack) {
    if (!AppBskyGraphStarterpack.isRecord(starterPack.record)) {
        return;
    }
    var starterPackView;
    if (AppBskyGraphDefs.isStarterPackView(starterPack)) {
        starterPackView = starterPack;
    }
    else if (AppBskyGraphDefs.isStarterPackViewBasic(starterPack) &&
        bsky.validate(starterPack.record, AppBskyGraphStarterpack.validateRecord)) {
        var feeds = void 0;
        if (starterPack.record.feeds) {
            feeds = [];
            for (var _i = 0, _a = starterPack.record.feeds; _i < _a.length; _i++) {
                var feed = _a[_i];
                // note: types are wrong? claims to be `FeedItem`, but we actually
                // get un$typed `GeneratorView` objects here -sfn
                if (bsky.validate(feed, AppBskyFeedDefs.validateGeneratorView)) {
                    feeds.push(feed);
                }
            }
        }
        var listView = {
            uri: starterPack.record.list,
            // This will be populated once the data from server is fetched
            cid: '',
            name: starterPack.record.name,
            purpose: 'app.bsky.graph.defs#referencelist',
        };
        starterPackView = __assign(__assign({}, starterPack), { $type: 'app.bsky.graph.defs#starterPackView', list: listView, feeds: feeds });
    }
    if (starterPackView) {
        queryClient.setQueryData(RQKEY({ uri: starterPack.uri }), starterPackView);
    }
}
