var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { AppBskyFeedThreadgate } from '@atproto/api';
import * as bsky from '#/types/bsky';
export function threadgateViewToAllowUISetting(threadgateView) {
    // Validate the record for clarity, since backwards compat code is a little confusing
    var threadgate = threadgateView &&
        bsky.validate(threadgateView.record, AppBskyFeedThreadgate.validateRecord)
        ? threadgateView.record
        : undefined;
    return threadgateRecordToAllowUISetting(threadgate);
}
/**
 * Converts a full {@link AppBskyFeedThreadgate.Record} to a list of
 * {@link ThreadgateAllowUISetting}, for use by app UI.
 */
export function threadgateRecordToAllowUISetting(threadgate) {
    /*
     * If `threadgate` doesn't exist (default), or if `threadgate.allow === undefined`, it means
     * anyone can reply.
     *
     * If `threadgate.allow === []` it means no one can reply, and we translate to UI code
     * here. This was a historical choice, and we have no lexicon representation
     * for 'replies disabled' other than an empty array.
     */
    if (!threadgate || threadgate.allow === undefined) {
        return [{ type: 'everybody' }];
    }
    if (threadgate.allow.length === 0) {
        return [{ type: 'nobody' }];
    }
    var settings = threadgate.allow
        .map(function (allow) {
        var setting;
        if (AppBskyFeedThreadgate.isMentionRule(allow)) {
            setting = { type: 'mention' };
        }
        else if (AppBskyFeedThreadgate.isFollowingRule(allow)) {
            setting = { type: 'following' };
        }
        else if (AppBskyFeedThreadgate.isListRule(allow)) {
            setting = { type: 'list', list: allow.list };
        }
        else if (AppBskyFeedThreadgate.isFollowerRule(allow)) {
            setting = { type: 'followers' };
        }
        return setting;
    })
        .filter(function (n) { return !!n; });
    return settings;
}
/**
 * Converts an array of {@link ThreadgateAllowUISetting} to the `allow` prop on
 * {@link AppBskyFeedThreadgate.Record}.
 *
 * If the `allow` property on the record is undefined, we infer that to mean
 * that everyone can reply. If it's an empty array, we infer that to mean that
 * no one can reply.
 */
export function threadgateAllowUISettingToAllowRecordValue(threadgate) {
    if (threadgate.find(function (v) { return v.type === 'everybody'; })) {
        return undefined;
    }
    var allow = [];
    if (!threadgate.find(function (v) { return v.type === 'nobody'; })) {
        for (var _i = 0, threadgate_1 = threadgate; _i < threadgate_1.length; _i++) {
            var rule = threadgate_1[_i];
            if (rule.type === 'mention') {
                allow.push({ $type: 'app.bsky.feed.threadgate#mentionRule' });
            }
            else if (rule.type === 'following') {
                allow.push({ $type: 'app.bsky.feed.threadgate#followingRule' });
            }
            else if (rule.type === 'followers') {
                allow.push({ $type: 'app.bsky.feed.threadgate#followerRule' });
            }
            else if (rule.type === 'list') {
                allow.push({
                    $type: 'app.bsky.feed.threadgate#listRule',
                    list: rule.list,
                });
            }
        }
    }
    return allow;
}
/**
 * Merges two {@link AppBskyFeedThreadgate.Record} objects, combining their
 * `allow` and `hiddenReplies` arrays and de-deduplicating them.
 *
 * Note: `allow` can be undefined here, be sure you don't accidentally set it
 * to an empty array. See other comments in this file.
 */
export function mergeThreadgateRecords(prev, next) {
    // can be undefined if everyone can reply!
    var allow = prev.allow || next.allow
        ? __spreadArray(__spreadArray([], (prev.allow || []), true), (next.allow || []), true).filter(function (v, i, a) { return a.findIndex(function (t) { return t.$type === v.$type; }) === i; })
        : undefined;
    var hiddenReplies = Array.from(new Set(__spreadArray(__spreadArray([], (prev.hiddenReplies || []), true), (next.hiddenReplies || []), true)));
    return createThreadgateRecord({
        post: prev.post,
        allow: allow, // can be undefined!
        hiddenReplies: hiddenReplies,
    });
}
/**
 * Create a new {@link AppBskyFeedThreadgate.Record} object with the given
 * properties.
 */
export function createThreadgateRecord(threadgate) {
    if (!threadgate.post) {
        throw new Error('Cannot create a threadgate record without a post URI');
    }
    return {
        $type: 'app.bsky.feed.threadgate',
        post: threadgate.post,
        createdAt: new Date().toISOString(),
        allow: threadgate.allow, // can be undefined!
        hiddenReplies: threadgate.hiddenReplies || [],
    };
}
