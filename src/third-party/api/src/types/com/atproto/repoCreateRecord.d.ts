import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    did: string;
    collection: string;
    validate?: boolean;
}
export interface CallOptions {
    headers?: Headers;
    encoding: 'application/json';
}
export interface InputSchema {
    [k: string]: unknown;
}
export interface OutputSchema {
    uri: string;
    cid: string;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
