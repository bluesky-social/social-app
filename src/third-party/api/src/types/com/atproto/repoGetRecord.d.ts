import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    user: string;
    collection: string;
    rkey: string;
    cid?: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    uri: string;
    cid?: string;
    value: {};
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
