var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '#/logger';
import { RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';
import * as Toast from '#/view/com/util/Toast';
import { updatePostShadow } from '../cache/post-shadow';
import { useAgent, useSession } from '../session';
import { useProfileUpdateMutation } from './profile';
export function usePinnedPostMutation() {
    var _this = this;
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var queryClient = useQueryClient();
    var profileUpdateMutate = useProfileUpdateMutation().mutateAsync;
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var pinCurrentPost, prevPinnedPost, profile, e_1;
            var _c;
            var postUri = _b.postUri, postCid = _b.postCid, action = _b.action;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        pinCurrentPost = action === 'pin';
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 4, , 5]);
                        updatePostShadow(queryClient, postUri, { pinned: pinCurrentPost });
                        // get the currently pinned post so we can optimistically remove the pin from it
                        if (!currentAccount)
                            throw new Error('Not signed in');
                        return [4 /*yield*/, agent.getProfile({
                                actor: currentAccount.did,
                            })];
                    case 2:
                        profile = (_d.sent()).data;
                        prevPinnedPost = (_c = profile.pinnedPost) === null || _c === void 0 ? void 0 : _c.uri;
                        if (prevPinnedPost && prevPinnedPost !== postUri) {
                            updatePostShadow(queryClient, prevPinnedPost, { pinned: false });
                        }
                        return [4 /*yield*/, profileUpdateMutate({
                                profile: profile,
                                updates: function (existing) {
                                    existing.pinnedPost = pinCurrentPost
                                        ? { uri: postUri, cid: postCid }
                                        : undefined;
                                    return existing;
                                },
                                checkCommitted: function (res) {
                                    var _a;
                                    return pinCurrentPost
                                        ? ((_a = res.data.pinnedPost) === null || _a === void 0 ? void 0 : _a.uri) === postUri
                                        : !res.data.pinnedPost;
                                },
                            })];
                    case 3:
                        _d.sent();
                        if (pinCurrentPost) {
                            Toast.show(_(msg({ message: 'Post pinned', context: 'toast' })));
                        }
                        else {
                            Toast.show(_(msg({ message: 'Post unpinned', context: 'toast' })));
                        }
                        queryClient.invalidateQueries({
                            queryKey: FEED_RQKEY("author|".concat(currentAccount.did, "|posts_and_author_threads")),
                        });
                        queryClient.invalidateQueries({
                            queryKey: FEED_RQKEY("author|".concat(currentAccount.did, "|posts_with_replies")),
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _d.sent();
                        Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Failed to pin post"], ["Failed to pin post"])))));
                        logger.error('Failed to pin post', { message: String(e_1) });
                        // revert optimistic update
                        updatePostShadow(queryClient, postUri, {
                            pinned: !pinCurrentPost,
                        });
                        if (prevPinnedPost && prevPinnedPost !== postUri) {
                            updatePostShadow(queryClient, prevPinnedPost, { pinned: true });
                        }
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); },
    });
}
var templateObject_1;
