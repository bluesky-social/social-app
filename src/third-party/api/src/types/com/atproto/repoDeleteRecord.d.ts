import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    did: string;
    collection: string;
    rkey: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface Response {
    success: boolean;
    headers: Headers;
}
export declare function toKnownErr(e: any): any;
