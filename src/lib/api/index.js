var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
import { AtUri, BlobRef, RichText, } from '@atproto/api';
import { TID } from '@atproto/common-web';
import * as dcbor from '@ipld/dag-cbor';
import { t } from '@lingui/macro';
import { sha256 } from 'js-sha256';
import { CID } from 'multiformats/cid';
import * as Hasher from 'multiformats/hashes/hasher';
import { isNetworkError } from '#/lib/strings/errors';
import { shortenLinks, stripInvalidMentions } from '#/lib/strings/rich-text-manip';
import { logger } from '#/logger';
import { compressImage } from '#/state/gallery';
import { fetchResolveGifQuery, fetchResolveLinkQuery, } from '#/state/queries/resolve-link';
import { createThreadgateRecord, threadgateAllowUISettingToAllowRecordValue, } from '#/state/queries/threadgate';
import { createGIFDescription } from '../gif-alt-text';
import { uploadBlob } from './upload-blob';
export { uploadBlob };
export function post(agent, queryClient, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var thread, replyPromise, langs, did, writes, uris, now, tid, i, draft, rtPromise, embedPromise, labels, rkey, uri, rt, embed, reply, record, ref, e_1;
        var _a;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    thread = opts.thread;
                    (_b = opts.onStateChange) === null || _b === void 0 ? void 0 : _b.call(opts, t(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Processing..."], ["Processing..."]))));
                    if (opts.replyTo) {
                        // Not awaited to avoid waterfalls.
                        replyPromise = resolveReply(agent, opts.replyTo);
                    }
                    langs = opts.langs;
                    if (opts.langs) {
                        langs = opts.langs.slice(0, 3);
                    }
                    did = agent.assertDid;
                    writes = [];
                    uris = [];
                    now = new Date();
                    i = 0;
                    _f.label = 1;
                case 1:
                    if (!(i < thread.posts.length)) return [3 /*break*/, 7];
                    draft = thread.posts[i];
                    rtPromise = resolveRT(agent, draft.richtext);
                    embedPromise = resolveEmbed(agent, queryClient, draft, opts.onStateChange);
                    labels = void 0;
                    if (draft.labels.length) {
                        labels = {
                            $type: 'com.atproto.label.defs#selfLabels',
                            values: draft.labels.map(function (val) { return ({ val: val }); }),
                        };
                    }
                    // The sorting behavior for multiple posts sharing the same createdAt time is
                    // undefined, so what we'll do here is increment the time by 1 for every post
                    now.setMilliseconds(now.getMilliseconds() + 1);
                    tid = TID.next(tid);
                    rkey = tid.toString();
                    uri = "at://".concat(did, "/app.bsky.feed.post/").concat(rkey);
                    uris.push(uri);
                    return [4 /*yield*/, rtPromise];
                case 2:
                    rt = _f.sent();
                    return [4 /*yield*/, embedPromise];
                case 3:
                    embed = _f.sent();
                    return [4 /*yield*/, replyPromise];
                case 4:
                    reply = _f.sent();
                    record = {
                        // IMPORTANT: $type has to exist, CID is calculated with the `$type` field
                        // present and will produce the wrong CID if you omit it.
                        $type: 'app.bsky.feed.post',
                        createdAt: now.toISOString(),
                        text: rt.text,
                        facets: rt.facets,
                        reply: reply,
                        embed: embed,
                        langs: langs,
                        labels: labels,
                    };
                    writes.push({
                        $type: 'com.atproto.repo.applyWrites#create',
                        collection: 'app.bsky.feed.post',
                        rkey: rkey,
                        value: record,
                    });
                    if (i === 0 && thread.threadgate.some(function (tg) { return tg.type !== 'everybody'; })) {
                        writes.push({
                            $type: 'com.atproto.repo.applyWrites#create',
                            collection: 'app.bsky.feed.threadgate',
                            rkey: rkey,
                            value: createThreadgateRecord({
                                createdAt: now.toISOString(),
                                post: uri,
                                allow: threadgateAllowUISettingToAllowRecordValue(thread.threadgate),
                            }),
                        });
                    }
                    if (((_c = thread.postgate.embeddingRules) === null || _c === void 0 ? void 0 : _c.length) ||
                        ((_d = thread.postgate.detachedEmbeddingUris) === null || _d === void 0 ? void 0 : _d.length)) {
                        writes.push({
                            $type: 'com.atproto.repo.applyWrites#create',
                            collection: 'app.bsky.feed.postgate',
                            rkey: rkey,
                            value: __assign(__assign({}, thread.postgate), { $type: 'app.bsky.feed.postgate', createdAt: now.toISOString(), post: uri }),
                        });
                    }
                    _a = {};
                    return [4 /*yield*/, computeCid(record)];
                case 5:
                    ref = (_a.cid = _f.sent(),
                        _a.uri = uri,
                        _a);
                    replyPromise = {
                        root: (_e = reply === null || reply === void 0 ? void 0 : reply.root) !== null && _e !== void 0 ? _e : ref,
                        parent: ref,
                    };
                    _f.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 1];
                case 7:
                    _f.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, agent.com.atproto.repo.applyWrites({
                            repo: agent.assertDid,
                            writes: writes,
                            validate: true,
                        })];
                case 8:
                    _f.sent();
                    return [3 /*break*/, 10];
                case 9:
                    e_1 = _f.sent();
                    logger.error("Failed to create post", {
                        safeMessage: e_1.message,
                    });
                    if (isNetworkError(e_1)) {
                        throw new Error(t(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Post failed to upload. Please check your Internet connection and try again."], ["Post failed to upload. Please check your Internet connection and try again."]))));
                    }
                    else {
                        throw e_1;
                    }
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/, { uris: uris }];
            }
        });
    });
}
function resolveRT(agent, richtext) {
    return __awaiter(this, void 0, void 0, function () {
        var trimmedText, rt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    trimmedText = richtext.text
                        // Trim leading whitespace-only lines (but don't break ASCII art).
                        .replace(/^(\s*\n)+/, '')
                        // Trim any trailing whitespace.
                        .trimEnd();
                    rt = new RichText({ text: trimmedText }, { cleanNewlines: true });
                    return [4 /*yield*/, rt.detectFacets(agent)];
                case 1:
                    _a.sent();
                    rt = shortenLinks(rt);
                    rt = stripInvalidMentions(rt);
                    return [2 /*return*/, rt];
            }
        });
    });
}
function resolveReply(agent, replyTo) {
    return __awaiter(this, void 0, void 0, function () {
        var replyToUrip, parentPost, parentRef;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    replyToUrip = new AtUri(replyTo);
                    return [4 /*yield*/, agent.getPost({
                            repo: replyToUrip.host,
                            rkey: replyToUrip.rkey,
                        })];
                case 1:
                    parentPost = _b.sent();
                    if (parentPost) {
                        parentRef = {
                            uri: parentPost.uri,
                            cid: parentPost.cid,
                        };
                        return [2 /*return*/, {
                                root: ((_a = parentPost.value.reply) === null || _a === void 0 ? void 0 : _a.root) || parentRef,
                                parent: parentRef,
                            }];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function resolveEmbed(agent, queryClient, draft, onStateChange) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, resolvedMedia_1, resolvedQuote, resolvedMedia, resolvedLink;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!draft.embed.quote) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.all([
                            resolveMedia(agent, queryClient, draft.embed, onStateChange),
                            resolveRecord(agent, queryClient, draft.embed.quote.uri),
                        ])];
                case 1:
                    _a = _b.sent(), resolvedMedia_1 = _a[0], resolvedQuote = _a[1];
                    if (resolvedMedia_1) {
                        return [2 /*return*/, {
                                $type: 'app.bsky.embed.recordWithMedia',
                                record: {
                                    $type: 'app.bsky.embed.record',
                                    record: resolvedQuote,
                                },
                                media: resolvedMedia_1,
                            }];
                    }
                    return [2 /*return*/, {
                            $type: 'app.bsky.embed.record',
                            record: resolvedQuote,
                        }];
                case 2: return [4 /*yield*/, resolveMedia(agent, queryClient, draft.embed, onStateChange)];
                case 3:
                    resolvedMedia = _b.sent();
                    if (resolvedMedia) {
                        return [2 /*return*/, resolvedMedia];
                    }
                    if (!draft.embed.link) return [3 /*break*/, 5];
                    return [4 /*yield*/, fetchResolveLinkQuery(queryClient, agent, draft.embed.link.uri)];
                case 4:
                    resolvedLink = _b.sent();
                    if (resolvedLink.type === 'record') {
                        return [2 /*return*/, {
                                $type: 'app.bsky.embed.record',
                                record: resolvedLink.record,
                            }];
                    }
                    _b.label = 5;
                case 5: return [2 /*return*/, undefined];
            }
        });
    });
}
function resolveMedia(agent, queryClient, embedDraft, onStateChange) {
    return __awaiter(this, void 0, void 0, function () {
        var imagesDraft, images, videoDraft, captions, width, height, aspectRatio, gifDraft, resolvedGif, blob, _a, path, mime, response, resolvedLink, blob, _b, path, mime, response;
        var _this = this;
        var _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (!(((_c = embedDraft.media) === null || _c === void 0 ? void 0 : _c.type) === 'images')) return [3 /*break*/, 2];
                    imagesDraft = embedDraft.media.images;
                    logger.debug("Uploading images", {
                        count: imagesDraft.length,
                    });
                    onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange(t(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Uploading images..."], ["Uploading images..."]))));
                    return [4 /*yield*/, Promise.all(imagesDraft.map(function (image, i) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, path, width, height, mime, res;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        logger.debug("Compressing image #".concat(i));
                                        return [4 /*yield*/, compressImage(image)];
                                    case 1:
                                        _a = _b.sent(), path = _a.path, width = _a.width, height = _a.height, mime = _a.mime;
                                        logger.debug("Uploading image #".concat(i));
                                        return [4 /*yield*/, uploadBlob(agent, path, mime)];
                                    case 2:
                                        res = _b.sent();
                                        return [2 /*return*/, {
                                                image: res.data.blob,
                                                alt: image.alt,
                                                aspectRatio: { width: width, height: height },
                                            }];
                                }
                            });
                        }); }))];
                case 1:
                    images = _f.sent();
                    return [2 /*return*/, {
                            $type: 'app.bsky.embed.images',
                            images: images,
                        }];
                case 2:
                    if (!(((_d = embedDraft.media) === null || _d === void 0 ? void 0 : _d.type) === 'video' &&
                        embedDraft.media.video.status === 'done')) return [3 /*break*/, 4];
                    videoDraft = embedDraft.media.video;
                    return [4 /*yield*/, Promise.all(videoDraft.captions
                            .filter(function (caption) { return caption.lang !== ''; })
                            .map(function (caption) { return __awaiter(_this, void 0, void 0, function () {
                            var data;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, agent.uploadBlob(caption.file, {
                                            encoding: 'text/vtt',
                                        })];
                                    case 1:
                                        data = (_a.sent()).data;
                                        return [2 /*return*/, { lang: caption.lang, file: data.blob }];
                                }
                            });
                        }); }))
                        // lexicon numbers must be floats
                    ];
                case 3:
                    captions = _f.sent();
                    width = Math.round(videoDraft.asset.width);
                    height = Math.round(videoDraft.asset.height);
                    aspectRatio = width > 0 && height > 0 ? { width: width, height: height } : undefined;
                    if (!aspectRatio) {
                        logger.error("Invalid aspect ratio - got { width: ".concat(videoDraft.asset.width, ", height: ").concat(videoDraft.asset.height, " }"));
                    }
                    return [2 /*return*/, {
                            $type: 'app.bsky.embed.video',
                            video: videoDraft.pendingPublish.blobRef,
                            alt: videoDraft.altText || undefined,
                            captions: captions.length === 0 ? undefined : captions,
                            aspectRatio: aspectRatio,
                        }];
                case 4:
                    if (!(((_e = embedDraft.media) === null || _e === void 0 ? void 0 : _e.type) === 'gif')) return [3 /*break*/, 8];
                    gifDraft = embedDraft.media;
                    return [4 /*yield*/, fetchResolveGifQuery(queryClient, agent, gifDraft.gif)];
                case 5:
                    resolvedGif = _f.sent();
                    blob = void 0;
                    if (!resolvedGif.thumb) return [3 /*break*/, 7];
                    onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange(t(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Uploading link thumbnail..."], ["Uploading link thumbnail..."]))));
                    _a = resolvedGif.thumb.source, path = _a.path, mime = _a.mime;
                    return [4 /*yield*/, uploadBlob(agent, path, mime)];
                case 6:
                    response = _f.sent();
                    blob = response.data.blob;
                    _f.label = 7;
                case 7: return [2 /*return*/, {
                        $type: 'app.bsky.embed.external',
                        external: {
                            uri: resolvedGif.uri,
                            title: resolvedGif.title,
                            description: createGIFDescription(resolvedGif.title, gifDraft.alt),
                            thumb: blob,
                        },
                    }];
                case 8:
                    if (!embedDraft.link) return [3 /*break*/, 12];
                    return [4 /*yield*/, fetchResolveLinkQuery(queryClient, agent, embedDraft.link.uri)];
                case 9:
                    resolvedLink = _f.sent();
                    if (!(resolvedLink.type === 'external')) return [3 /*break*/, 12];
                    blob = void 0;
                    if (!resolvedLink.thumb) return [3 /*break*/, 11];
                    onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange(t(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Uploading link thumbnail..."], ["Uploading link thumbnail..."]))));
                    _b = resolvedLink.thumb.source, path = _b.path, mime = _b.mime;
                    return [4 /*yield*/, uploadBlob(agent, path, mime)];
                case 10:
                    response = _f.sent();
                    blob = response.data.blob;
                    _f.label = 11;
                case 11: return [2 /*return*/, {
                        $type: 'app.bsky.embed.external',
                        external: {
                            uri: resolvedLink.uri,
                            title: resolvedLink.title,
                            description: resolvedLink.description,
                            thumb: blob,
                        },
                    }];
                case 12: return [2 /*return*/, undefined];
            }
        });
    });
}
function resolveRecord(agent, queryClient, uri) {
    return __awaiter(this, void 0, void 0, function () {
        var resolvedLink;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchResolveLinkQuery(queryClient, agent, uri)];
                case 1:
                    resolvedLink = _a.sent();
                    if (resolvedLink.type !== 'record') {
                        throw Error(t(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Expected uri to resolve to a record"], ["Expected uri to resolve to a record"]))));
                    }
                    return [2 /*return*/, resolvedLink.record];
            }
        });
    });
}
// The built-in hashing functions from multiformats (`multiformats/hashes/sha2`)
// are meant for Node.js, this is the cross-platform equivalent.
var mf_sha256 = Hasher.from({
    name: 'sha2-256',
    code: 0x12,
    encode: function (input) {
        var digest = sha256.arrayBuffer(input);
        return new Uint8Array(digest);
    },
});
function computeCid(record) {
    return __awaiter(this, void 0, void 0, function () {
        var prepared, encoded, digest, cid;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prepared = prepareForHashing(record);
                    encoded = dcbor.encode(prepared);
                    return [4 /*yield*/, mf_sha256.digest(encoded)
                        // 3. Create a CIDv1, specifying DAG-CBOR as content (code 0x71)
                    ];
                case 1:
                    digest = _a.sent();
                    cid = CID.createV1(0x71, digest);
                    // 4. Get the Base32 representation of the CID (`b` prefix)
                    return [2 /*return*/, cid.toString()];
            }
        });
    });
}
// Returns a transformed version of the object for use in DAG-CBOR.
function prepareForHashing(v) {
    // IMPORTANT: BlobRef#ipld() returns the correct object we need for hashing,
    // the API client will convert this for you but we're hashing in the client,
    // so we need it *now*.
    if (v instanceof BlobRef) {
        return v.ipld();
    }
    // Walk through arrays
    if (Array.isArray(v)) {
        var pure_1 = true;
        var mapped = v.map(function (value) {
            if (value !== (value = prepareForHashing(value))) {
                pure_1 = false;
            }
            return value;
        });
        return pure_1 ? v : mapped;
    }
    // Walk through plain objects
    if (isPlainObject(v)) {
        var obj = {};
        var pure = true;
        for (var key in v) {
            var value = v[key];
            // `value` is undefined
            if (value === undefined) {
                pure = false;
                continue;
            }
            // `prepareObject` returned a value that's different from what we had before
            if (value !== (value = prepareForHashing(value))) {
                pure = false;
            }
            obj[key] = value;
        }
        // Return as is if we haven't needed to tamper with anything
        return pure ? v : obj;
    }
    return v;
}
function isPlainObject(v) {
    if (typeof v !== 'object' || v === null) {
        return false;
    }
    var proto = Object.getPrototypeOf(v);
    return proto === Object.prototype || proto === null;
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
