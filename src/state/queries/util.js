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
import { AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, AppBskyFeedPost, } from '@atproto/api';
import * as bsky from '#/types/bsky';
export function truncateAndInvalidate(queryClient, queryKey) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            queryClient.setQueriesData({ queryKey: queryKey }, function (data) {
                if (data) {
                    return {
                        pageParams: data.pageParams.slice(0, 1),
                        pages: data.pages.slice(0, 1),
                    };
                }
                return data;
            });
            return [2 /*return*/, queryClient.invalidateQueries({ queryKey: queryKey })];
        });
    });
}
// Given an AtUri, this function will check if the AtUri matches a
// hit regardless of whether the AtUri uses a DID or handle as a host.
//
// AtUri should be the URI that is being searched for, while currentUri
// is the URI that is being checked. currentAuthor is the author
// of the currentUri that is being checked.
export function didOrHandleUriMatches(atUri, record) {
    if (atUri.host.startsWith('did:')) {
        return atUri.href === record.uri;
    }
    return atUri.host === record.author.handle && record.uri.endsWith(atUri.rkey);
}
export function getEmbeddedPost(v) {
    if (bsky.dangerousIsType(v, AppBskyEmbedRecord.isView)) {
        if (AppBskyEmbedRecord.isViewRecord(v.record) &&
            AppBskyFeedPost.isRecord(v.record.value)) {
            return v.record;
        }
    }
    if (bsky.dangerousIsType(v, AppBskyEmbedRecordWithMedia.isView)) {
        if (AppBskyEmbedRecord.isViewRecord(v.record.record) &&
            AppBskyFeedPost.isRecord(v.record.record.value)) {
            return v.record.record;
        }
    }
}
export function embedViewRecordToPostView(v) {
    var _a;
    return {
        uri: v.uri,
        cid: v.cid,
        author: v.author,
        record: v.value,
        indexedAt: v.indexedAt,
        labels: v.labels,
        embed: (_a = v.embeds) === null || _a === void 0 ? void 0 : _a[0],
        likeCount: v.likeCount,
        quoteCount: v.quoteCount,
        replyCount: v.replyCount,
        repostCount: v.repostCount,
    };
}
