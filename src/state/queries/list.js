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
import { AtUri, } from '@atproto/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import chunk from 'lodash.chunk';
import { uploadBlob } from '#/lib/api';
import { until } from '#/lib/async/until';
import { STALE } from '#/state/queries';
import { useAgent, useSession } from '#/state/session';
import { invalidate as invalidateMyLists } from './my-lists';
import { RQKEY as PROFILE_LISTS_RQKEY } from './profile-lists';
export var RQKEY_ROOT = 'list';
export var RQKEY = function (uri) { return [RQKEY_ROOT, uri]; };
export function useListQuery(uri) {
    var agent = useAgent();
    return useQuery({
        staleTime: STALE.MINUTES.ONE,
        queryKey: RQKEY(uri || ''),
        queryFn: function () {
            return __awaiter(this, void 0, void 0, function () {
                var res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!uri) {
                                throw new Error('URI not provided');
                            }
                            return [4 /*yield*/, agent.app.bsky.graph.getList({
                                    list: uri,
                                    limit: 1,
                                })];
                        case 1:
                            res = _a.sent();
                            return [2 /*return*/, res.data.list];
                    }
                });
            });
        },
        enabled: !!uri,
    });
}
export function useListCreateMutation() {
    var currentAccount = useSession().currentAccount;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var record, blobRes, res;
                var purpose = _b.purpose, name = _b.name, description = _b.description, descriptionFacets = _b.descriptionFacets, avatar = _b.avatar;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!currentAccount) {
                                throw new Error('Not signed in');
                            }
                            if (purpose !== 'app.bsky.graph.defs#curatelist' &&
                                purpose !== 'app.bsky.graph.defs#modlist') {
                                throw new Error('Invalid list purpose: must be curatelist or modlist');
                            }
                            record = {
                                purpose: purpose,
                                name: name,
                                description: description,
                                descriptionFacets: descriptionFacets,
                                avatar: undefined,
                                createdAt: new Date().toISOString(),
                            };
                            if (!avatar) return [3 /*break*/, 2];
                            return [4 /*yield*/, uploadBlob(agent, avatar.path, avatar.mime)];
                        case 1:
                            blobRes = _c.sent();
                            record.avatar = blobRes.data.blob;
                            _c.label = 2;
                        case 2: return [4 /*yield*/, agent.app.bsky.graph.list.create({
                                repo: currentAccount.did,
                            }, record)
                            // wait for the appview to update
                        ];
                        case 3:
                            res = _c.sent();
                            // wait for the appview to update
                            return [4 /*yield*/, whenAppViewReady(agent, res.uri, function (v) {
                                    var _a;
                                    return typeof ((_a = v === null || v === void 0 ? void 0 : v.data) === null || _a === void 0 ? void 0 : _a.list.uri) === 'string';
                                })];
                        case 4:
                            // wait for the appview to update
                            _c.sent();
                            return [2 /*return*/, res];
                    }
                });
            });
        },
        onSuccess: function () {
            invalidateMyLists(queryClient);
            queryClient.invalidateQueries({
                queryKey: PROFILE_LISTS_RQKEY(currentAccount.did),
            });
        },
    });
}
export function useListMetadataMutation() {
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var _c, hostname, rkey, record, blobRes, res;
                var uri = _b.uri, name = _b.name, description = _b.description, descriptionFacets = _b.descriptionFacets, avatar = _b.avatar;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _c = new AtUri(uri), hostname = _c.hostname, rkey = _c.rkey;
                            if (!currentAccount) {
                                throw new Error('Not signed in');
                            }
                            if (currentAccount.did !== hostname) {
                                throw new Error('You do not own this list');
                            }
                            return [4 /*yield*/, agent.app.bsky.graph.list.get({
                                    repo: currentAccount.did,
                                    rkey: rkey,
                                })
                                // update the fields
                            ];
                        case 1:
                            record = (_d.sent()).value;
                            // update the fields
                            record.name = name;
                            record.description = description;
                            record.descriptionFacets = descriptionFacets;
                            if (!avatar) return [3 /*break*/, 3];
                            return [4 /*yield*/, uploadBlob(agent, avatar.path, avatar.mime)];
                        case 2:
                            blobRes = _d.sent();
                            record.avatar = blobRes.data.blob;
                            return [3 /*break*/, 4];
                        case 3:
                            if (avatar === null) {
                                record.avatar = undefined;
                            }
                            _d.label = 4;
                        case 4: return [4 /*yield*/, agent.com.atproto.repo.putRecord({
                                repo: currentAccount.did,
                                collection: 'app.bsky.graph.list',
                                rkey: rkey,
                                record: record,
                            })];
                        case 5:
                            res = (_d.sent()).data;
                            // wait for the appview to update
                            return [4 /*yield*/, whenAppViewReady(agent, res.uri, function (v) {
                                    var list = v.data.list;
                                    return (list.name === record.name && list.description === record.description);
                                })];
                        case 6:
                            // wait for the appview to update
                            _d.sent();
                            return [2 /*return*/, res];
                    }
                });
            });
        },
        onSuccess: function (data, variables) {
            invalidateMyLists(queryClient);
            queryClient.invalidateQueries({
                queryKey: PROFILE_LISTS_RQKEY(currentAccount.did),
            });
            queryClient.invalidateQueries({
                queryKey: RQKEY(variables.uri),
            });
        },
    });
}
export function useListDeleteMutation() {
    var _this = this;
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var cursor, listitemRecordUris, i, res, createDel, writes, _i, _c, writesChunk;
            var uri = _b.uri;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!currentAccount) {
                            return [2 /*return*/];
                        }
                        listitemRecordUris = [];
                        i = 0;
                        _d.label = 1;
                    case 1:
                        if (!(i < 100)) return [3 /*break*/, 4];
                        return [4 /*yield*/, agent.app.bsky.graph.listitem.list({
                                repo: currentAccount.did,
                                cursor: cursor,
                                limit: 100,
                            })];
                    case 2:
                        res = _d.sent();
                        listitemRecordUris = listitemRecordUris.concat(res.records
                            .filter(function (record) { return record.value.list === uri; })
                            .map(function (record) { return record.uri; }));
                        cursor = res.cursor;
                        if (!cursor) {
                            return [3 /*break*/, 4];
                        }
                        _d.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4:
                        createDel = function (uri) {
                            var urip = new AtUri(uri);
                            return {
                                $type: 'com.atproto.repo.applyWrites#delete',
                                collection: urip.collection,
                                rkey: urip.rkey,
                            };
                        };
                        writes = listitemRecordUris
                            .map(function (uri) { return createDel(uri); })
                            .concat([createDel(uri)]);
                        _i = 0, _c = chunk(writes, 10);
                        _d.label = 5;
                    case 5:
                        if (!(_i < _c.length)) return [3 /*break*/, 8];
                        writesChunk = _c[_i];
                        return [4 /*yield*/, agent.com.atproto.repo.applyWrites({
                                repo: currentAccount.did,
                                writes: writesChunk,
                            })];
                    case 6:
                        _d.sent();
                        _d.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 5];
                    case 8: 
                    // wait for the appview to update
                    return [4 /*yield*/, whenAppViewReady(agent, uri, function (v) {
                            return !(v === null || v === void 0 ? void 0 : v.success);
                        })];
                    case 9:
                        // wait for the appview to update
                        _d.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function () {
            invalidateMyLists(queryClient);
            queryClient.invalidateQueries({
                queryKey: PROFILE_LISTS_RQKEY(currentAccount.did),
            });
            // TODO!! /* dont await */ this.rootStore.preferences.removeSavedFeed(this.uri)
        },
    });
}
export function useListMuteMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var uri = _b.uri, mute = _b.mute;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!mute) return [3 /*break*/, 2];
                        return [4 /*yield*/, agent.muteModList(uri)];
                    case 1:
                        _c.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, agent.unmuteModList(uri)];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4: return [4 /*yield*/, whenAppViewReady(agent, uri, function (v) {
                            var _a;
                            return Boolean((_a = v === null || v === void 0 ? void 0 : v.data.list.viewer) === null || _a === void 0 ? void 0 : _a.muted) === mute;
                        })];
                    case 5:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (data, variables) {
            queryClient.invalidateQueries({
                queryKey: RQKEY(variables.uri),
            });
        },
    });
}
export function useListBlockMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var uri = _b.uri, block = _b.block;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!block) return [3 /*break*/, 2];
                        return [4 /*yield*/, agent.blockModList(uri)];
                    case 1:
                        _c.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, agent.unblockModList(uri)];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4: return [4 /*yield*/, whenAppViewReady(agent, uri, function (v) {
                            var _a, _b;
                            return block
                                ? typeof ((_a = v === null || v === void 0 ? void 0 : v.data.list.viewer) === null || _a === void 0 ? void 0 : _a.blocked) === 'string'
                                : !((_b = v === null || v === void 0 ? void 0 : v.data.list.viewer) === null || _b === void 0 ? void 0 : _b.blocked);
                        })];
                    case 5:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (data, variables) {
            queryClient.invalidateQueries({
                queryKey: RQKEY(variables.uri),
            });
        },
    });
}
function whenAppViewReady(agent, uri, fn) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, until(5, // 5 tries
                    1e3, // 1s delay between tries
                    fn, function () {
                        return agent.app.bsky.graph.getList({
                            list: uri,
                            limit: 1,
                        });
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
