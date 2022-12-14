import { Headers } from '@atproto/xrpc';
import * as AppBskyActorRef from '../actor/ref';
import * as AppBskyEmbedImages from '../embed/images';
import * as AppBskyEmbedExternal from '../embed/external';
export interface QueryParams {
    algorithm?: string;
    limit?: number;
    before?: string;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    cursor?: string;
    feed: FeedItem[];
    [k: string]: unknown;
}
export interface CallOptions {
    headers?: Headers;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
export interface FeedItem {
    uri: string;
    cid: string;
    author: AppBskyActorRef.WithInfo;
    trendedBy?: AppBskyActorRef.WithInfo;
    repostedBy?: AppBskyActorRef.WithInfo;
    record: {};
    embed?: AppBskyEmbedImages.Presented | AppBskyEmbedExternal.Presented | {
        $type: string;
        [k: string]: unknown;
    };
    replyCount: number;
    repostCount: number;
    upvoteCount: number;
    downvoteCount: number;
    indexedAt: string;
    myState?: MyState;
    [k: string]: unknown;
}
export interface MyState {
    repost?: string;
    upvote?: string;
    downvote?: string;
    [k: string]: unknown;
}
