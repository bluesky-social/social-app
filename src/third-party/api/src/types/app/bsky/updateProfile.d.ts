import { Headers } from '@atproto/xrpc';
export interface QueryParams {
}
export interface CallOptions {
    headers?: Headers;
    encoding: 'application/json';
}
export interface InputSchema {
    displayName?: string;
    description?: string;
    pinnedBadges?: BadgeRef[];
}
export interface BadgeRef {
    uri: string;
    cid: string;
}
export interface OutputSchema {
    uri: string;
    cid: string;
    record: {};
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
