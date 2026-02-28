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
import { AppBskyActorDefs, AppBskyFeedDefs, AppBskyFeedPost, AppBskyGraphDefs, } from '@atproto/api';
import * as bsky from '#/types/bsky';
export function parseReportSubject(subject) {
    if (!subject)
        return;
    if ('convoId' in subject) {
        return __assign({ type: 'convoMessage' }, subject);
    }
    if (AppBskyActorDefs.isProfileViewBasic(subject) ||
        AppBskyActorDefs.isProfileView(subject) ||
        AppBskyActorDefs.isProfileViewDetailed(subject)) {
        return {
            type: 'account',
            did: subject.did,
            nsid: 'app.bsky.actor.profile',
        };
    }
    else if (AppBskyActorDefs.isStatusView(subject)) {
        if (!subject.uri || !subject.cid)
            return;
        return {
            type: 'status',
            uri: subject.uri,
            cid: subject.cid,
            nsid: 'app.bsky.actor.status',
        };
    }
    else if (AppBskyGraphDefs.isListView(subject)) {
        return {
            type: 'list',
            uri: subject.uri,
            cid: subject.cid,
            nsid: 'app.bsky.graph.list',
        };
    }
    else if (AppBskyFeedDefs.isGeneratorView(subject)) {
        return {
            type: 'feed',
            uri: subject.uri,
            cid: subject.cid,
            nsid: 'app.bsky.feed.generator',
        };
    }
    else if (AppBskyGraphDefs.isStarterPackView(subject)) {
        return {
            type: 'starterPack',
            uri: subject.uri,
            cid: subject.cid,
            nsid: 'app.bsky.graph.starterPack',
        };
    }
    else if (AppBskyFeedDefs.isPostView(subject)) {
        var record = subject.record;
        var embed = bsky.post.parseEmbed(subject.embed);
        if (bsky.dangerousIsType(record, AppBskyFeedPost.isRecord)) {
            return {
                type: 'post',
                uri: subject.uri,
                cid: subject.cid,
                nsid: 'app.bsky.feed.post',
                attributes: {
                    reply: !!record.reply,
                    image: embed.type === 'images' ||
                        (embed.type === 'post_with_media' && embed.media.type === 'images'),
                    video: embed.type === 'video' ||
                        (embed.type === 'post_with_media' && embed.media.type === 'video'),
                    link: embed.type === 'link' ||
                        (embed.type === 'post_with_media' && embed.media.type === 'link'),
                    quote: embed.type === 'post' ||
                        (embed.type === 'post_with_media' &&
                            (embed.view.type === 'post' ||
                                embed.view.type === 'post_with_media')),
                },
            };
        }
    }
}
