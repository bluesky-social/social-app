import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    algorithm?: string;
    limit?: number;
    before?: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export declare type ActorKnown = 'app.bsky.system.actorUser' | 'app.bsky.system.actorScene';
export declare type ActorUnknown = string;
export interface OutputSchema {
    cursor?: string;
    feed: FeedItem[];
}
export interface FeedItem {
    uri: string;
    cid: string;
    author: Actor;
    trendedBy?: Actor;
    repostedBy?: Actor;
    record: {};
    embed?: RecordEmbed | ExternalEmbed | UnknownEmbed;
    replyCount: number;
    repostCount: number;
    upvoteCount: number;
    downvoteCount: number;
    indexedAt: string;
    myState?: {
        repost?: string;
        upvote?: string;
        downvote?: string;
    };
}
export interface Actor {
    did: string;
    declaration: Declaration;
    handle: string;
    actorType?: string;
    displayName?: string;
}
export interface Declaration {
    cid: string;
    actorType: ActorKnown | ActorUnknown;
}
export interface RecordEmbed {
    type: 'record';
    author: Actor;
    record: {};
}
export interface ExternalEmbed {
    type: 'external';
    uri: string;
    title: string;
    description: string;
    imageUri: string;
}
export interface UnknownEmbed {
    type: string;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
