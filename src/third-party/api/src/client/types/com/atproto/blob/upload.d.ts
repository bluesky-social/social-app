import { Headers } from '@atproto/xrpc';
export interface QueryParams {
}
export declare type InputSchema = string | Uint8Array;
export interface OutputSchema {
    cid: string;
    [k: string]: unknown;
}
export interface CallOptions {
    headers?: Headers;
    qp?: QueryParams;
    encoding: string;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
