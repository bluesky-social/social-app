import { Headers } from '@atproto/xrpc';
export interface QueryParams {
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    handle: string;
    did: string;
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
