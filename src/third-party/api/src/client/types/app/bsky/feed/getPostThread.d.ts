import { Headers, XRPCError } from '@atproto/xrpc';
import * as AppBskyFeedPost from './post';
export interface QueryParams {
    uri: string;
    depth?: number;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    thread: ThreadViewPost | NotFoundPost | {
        $type: string;
        [k: string]: unknown;
    };
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
export declare class NotFoundError extends XRPCError {
    constructor(src: XRPCError);
}
export declare function toKnownErr(e: any): any;
export interface ThreadViewPost {
    post: AppBskyFeedPost.View;
    parent?: ThreadViewPost | NotFoundPost | {
        $type: string;
        [k: string]: unknown;
    };
    replies?: (ThreadViewPost | NotFoundPost | {
        $type: string;
        [k: string]: unknown;
    })[];
    [k: string]: unknown;
}
export interface NotFoundPost {
    uri: string;
    notFound: true;
    [k: string]: unknown;
}
