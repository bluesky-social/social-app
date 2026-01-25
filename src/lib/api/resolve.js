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
import { AtUri } from '@atproto/api';
import { POST_IMG_MAX } from '#/lib/constants';
import { getLinkMeta } from '#/lib/link-meta/link-meta';
import { resolveShortLink } from '#/lib/link-meta/resolve-short-link';
import { downloadAndResize } from '#/lib/media/manip';
import { createStarterPackUri, parseStarterPackUri, } from '#/lib/strings/starter-pack';
import { isBskyCustomFeedUrl, isBskyListUrl, isBskyPostUrl, isBskyStarterPackUrl, isBskyStartUrl, isShortLink, } from '#/lib/strings/url-helpers';
import { createComposerImage } from '#/state/gallery';
import { createGIFDescription } from '../gif-alt-text';
import { convertBskyAppUrlIfNeeded, makeRecordUri } from '../strings/url-helpers';
var EmbeddingDisabledError = /** @class */ (function (_super) {
    __extends(EmbeddingDisabledError, _super);
    function EmbeddingDisabledError() {
        return _super.call(this, 'Embedding is disabled for this record') || this;
    }
    return EmbeddingDisabledError;
}(Error));
export { EmbeddingDisabledError };
export function resolveLink(agent, uri) {
    return __awaiter(this, void 0, void 0, function () {
        // Forked from useGetPost. TODO: move into RQ.
        function getPost(_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var urip, res_1, res;
                var uri = _b.uri;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            urip = new AtUri(uri);
                            if (!!urip.host.startsWith('did:')) return [3 /*break*/, 2];
                            return [4 /*yield*/, agent.resolveHandle({
                                    handle: urip.host,
                                })
                                // @ts-expect-error TODO new-sdk-migration
                            ];
                        case 1:
                            res_1 = _c.sent();
                            // @ts-expect-error TODO new-sdk-migration
                            urip.host = res_1.data.did;
                            _c.label = 2;
                        case 2: return [4 /*yield*/, agent.getPosts({
                                uris: [urip.toString()],
                            })];
                        case 3:
                            res = _c.sent();
                            if (res.success && res.data.posts[0]) {
                                return [2 /*return*/, res.data.posts[0]];
                            }
                            throw new Error('getPost: post not found');
                    }
                });
            });
        }
        // Forked from useFetchDid. TODO: move into RQ.
        function fetchDid(handleOrDid) {
            return __awaiter(this, void 0, void 0, function () {
                var identifier, res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            identifier = handleOrDid;
                            if (!!identifier.startsWith('did:')) return [3 /*break*/, 2];
                            return [4 /*yield*/, agent.resolveHandle({ handle: identifier })];
                        case 1:
                            res = _a.sent();
                            identifier = res.data.did;
                            _a.label = 2;
                        case 2: return [2 /*return*/, identifier];
                    }
                });
            });
        }
        var _a, _0, user, _1, rkey, recordUri, post, _b, _0, handleOrDid, _1, rkey, did, feed, res, _c, _0, handleOrDid, _1, rkey, did, list, res, parsed, did, starterPack, res;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!isShortLink(uri)) return [3 /*break*/, 2];
                    return [4 /*yield*/, resolveShortLink(uri)];
                case 1:
                    uri = _e.sent();
                    _e.label = 2;
                case 2:
                    if (!isBskyPostUrl(uri)) return [3 /*break*/, 4];
                    uri = convertBskyAppUrlIfNeeded(uri);
                    _a = uri.split('/').filter(Boolean), _0 = _a[0], user = _a[1], _1 = _a[2], rkey = _a[3];
                    recordUri = makeRecordUri(user, 'app.bsky.feed.post', rkey);
                    return [4 /*yield*/, getPost({ uri: recordUri })];
                case 3:
                    post = _e.sent();
                    if ((_d = post.viewer) === null || _d === void 0 ? void 0 : _d.embeddingDisabled) {
                        throw new EmbeddingDisabledError();
                    }
                    return [2 /*return*/, {
                            type: 'record',
                            record: {
                                cid: post.cid,
                                uri: post.uri,
                            },
                            kind: 'post',
                            view: post,
                        }];
                case 4:
                    if (!isBskyCustomFeedUrl(uri)) return [3 /*break*/, 7];
                    uri = convertBskyAppUrlIfNeeded(uri);
                    _b = uri.split('/').filter(Boolean), _0 = _b[0], handleOrDid = _b[1], _1 = _b[2], rkey = _b[3];
                    return [4 /*yield*/, fetchDid(handleOrDid)];
                case 5:
                    did = _e.sent();
                    feed = makeRecordUri(did, 'app.bsky.feed.generator', rkey);
                    return [4 /*yield*/, agent.app.bsky.feed.getFeedGenerator({ feed: feed })];
                case 6:
                    res = _e.sent();
                    return [2 /*return*/, {
                            type: 'record',
                            record: {
                                uri: res.data.view.uri,
                                cid: res.data.view.cid,
                            },
                            kind: 'feed',
                            view: res.data.view,
                        }];
                case 7:
                    if (!isBskyListUrl(uri)) return [3 /*break*/, 10];
                    uri = convertBskyAppUrlIfNeeded(uri);
                    _c = uri.split('/').filter(Boolean), _0 = _c[0], handleOrDid = _c[1], _1 = _c[2], rkey = _c[3];
                    return [4 /*yield*/, fetchDid(handleOrDid)];
                case 8:
                    did = _e.sent();
                    list = makeRecordUri(did, 'app.bsky.graph.list', rkey);
                    return [4 /*yield*/, agent.app.bsky.graph.getList({ list: list })];
                case 9:
                    res = _e.sent();
                    return [2 /*return*/, {
                            type: 'record',
                            record: {
                                uri: res.data.list.uri,
                                cid: res.data.list.cid,
                            },
                            kind: 'list',
                            view: res.data.list,
                        }];
                case 10:
                    if (!(isBskyStartUrl(uri) || isBskyStarterPackUrl(uri))) return [3 /*break*/, 13];
                    parsed = parseStarterPackUri(uri);
                    if (!parsed) {
                        throw new Error('Unexpectedly called getStarterPackAsEmbed with a non-starterpack url');
                    }
                    return [4 /*yield*/, fetchDid(parsed.name)];
                case 11:
                    did = _e.sent();
                    starterPack = createStarterPackUri({ did: did, rkey: parsed.rkey });
                    return [4 /*yield*/, agent.app.bsky.graph.getStarterPack({ starterPack: starterPack })];
                case 12:
                    res = _e.sent();
                    return [2 /*return*/, {
                            type: 'record',
                            record: {
                                uri: res.data.starterPack.uri,
                                cid: res.data.starterPack.cid,
                            },
                            kind: 'starter-pack',
                            view: res.data.starterPack,
                        }];
                case 13: return [2 /*return*/, resolveExternal(agent, uri)
                    // Forked from useGetPost. TODO: move into RQ.
                ];
            }
        });
    });
}
export function resolveGif(agent, gif) {
    return __awaiter(this, void 0, void 0, function () {
        var uri;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    uri = "".concat(gif.media_formats.gif.url, "?hh=").concat(gif.media_formats.gif.dims[1], "&ww=").concat(gif.media_formats.gif.dims[0]);
                    _a = {
                        type: 'external',
                        uri: uri,
                        title: gif.content_description,
                        description: createGIFDescription(gif.content_description)
                    };
                    return [4 /*yield*/, imageToThumb(gif.media_formats.preview.url)];
                case 1: return [2 /*return*/, (_a.thumb = _b.sent(),
                        _a)];
            }
        });
    });
}
function resolveExternal(agent, uri) {
    return __awaiter(this, void 0, void 0, function () {
        var result, _a;
        var _b;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, getLinkMeta(agent, uri)];
                case 1:
                    result = _e.sent();
                    _b = {
                        type: 'external',
                        uri: result.url,
                        title: (_c = result.title) !== null && _c !== void 0 ? _c : '',
                        description: (_d = result.description) !== null && _d !== void 0 ? _d : ''
                    };
                    if (!result.image) return [3 /*break*/, 3];
                    return [4 /*yield*/, imageToThumb(result.image)];
                case 2:
                    _a = _e.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = undefined;
                    _e.label = 4;
                case 4: return [2 /*return*/, (_b.thumb = _a,
                        _b)];
            }
        });
    });
}
export function imageToThumb(imageUri) {
    return __awaiter(this, void 0, void 0, function () {
        var img, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, downloadAndResize({
                            uri: imageUri,
                            width: POST_IMG_MAX.width,
                            height: POST_IMG_MAX.height,
                            mode: 'contain',
                            maxSize: POST_IMG_MAX.size,
                            timeout: 15e3,
                        })];
                case 1:
                    img = _b.sent();
                    if (!img) return [3 /*break*/, 3];
                    return [4 /*yield*/, createComposerImage(img)];
                case 2: return [2 /*return*/, _b.sent()];
                case 3: return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
