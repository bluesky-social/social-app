import { AppBskyEmbedExternal, AppBskyEmbedImages, AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo, AppBskyFeedDefs, AppBskyGraphDefs, AppBskyLabelerDefs, } from '@atproto/api';
export function parseEmbedRecordView(_a) {
    var record = _a.record;
    if (AppBskyEmbedRecord.isViewRecord(record)) {
        return {
            type: 'post',
            view: record,
        };
    }
    else if (AppBskyEmbedRecord.isViewNotFound(record)) {
        return {
            type: 'post_not_found',
            view: record,
        };
    }
    else if (AppBskyEmbedRecord.isViewBlocked(record)) {
        return {
            type: 'post_blocked',
            view: record,
        };
    }
    else if (AppBskyEmbedRecord.isViewDetached(record)) {
        return {
            type: 'post_detached',
            view: record,
        };
    }
    else if (AppBskyFeedDefs.isGeneratorView(record)) {
        return {
            type: 'feed',
            view: record,
        };
    }
    else if (AppBskyGraphDefs.isListView(record)) {
        return {
            type: 'list',
            view: record,
        };
    }
    else if (AppBskyLabelerDefs.isLabelerView(record)) {
        return {
            type: 'labeler',
            view: record,
        };
    }
    else if (AppBskyGraphDefs.isStarterPackViewBasic(record)) {
        return {
            type: 'starter_pack',
            view: record,
        };
    }
    else {
        return {
            type: 'unknown',
            view: null,
        };
    }
}
export function parseEmbed(embed) {
    if (AppBskyEmbedImages.isView(embed)) {
        return {
            type: 'images',
            view: embed,
        };
    }
    else if (AppBskyEmbedExternal.isView(embed)) {
        return {
            type: 'link',
            view: embed,
        };
    }
    else if (AppBskyEmbedVideo.isView(embed)) {
        return {
            type: 'video',
            view: embed,
        };
    }
    else if (AppBskyEmbedRecord.isView(embed)) {
        return parseEmbedRecordView(embed);
    }
    else if (AppBskyEmbedRecordWithMedia.isView(embed)) {
        return {
            type: 'post_with_media',
            view: parseEmbedRecordView(embed.record),
            media: parseEmbed(embed.media),
        };
    }
    else {
        return {
            type: 'unknown',
            view: null,
        };
    }
}
