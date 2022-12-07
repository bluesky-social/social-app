import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    handle?: string;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
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
