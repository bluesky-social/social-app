import { Headers } from '@atproto/xrpc';
import * as AppBskyActorRef from '../actor/ref';
export interface QueryParams {
    limit?: number;
    before?: string;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    cursor?: string;
    notifications: Notification[];
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
export interface Notification {
    uri: string;
    cid: string;
    author: AppBskyActorRef.WithInfo;
    reason: 'vote' | 'repost' | 'trend' | 'follow' | 'invite' | 'mention' | 'reply' | (string & {});
    reasonSubject?: string;
    record: {};
    isRead: boolean;
    indexedAt: string;
    [k: string]: unknown;
}
