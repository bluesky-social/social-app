import { Headers } from '@atproto/xrpc';
import * as AppBskyFeedFeedViewPost from './feedViewPost';
export interface QueryParams {
    author: string;
    limit?: number;
    before?: string;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    cursor?: string;
    feed: AppBskyFeedFeedViewPost.Main[];
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
