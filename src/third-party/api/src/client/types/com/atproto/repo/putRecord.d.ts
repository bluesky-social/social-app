import { Headers } from '@atproto/xrpc';
export interface QueryParams {
}
export interface InputSchema {
    did: string;
    collection: string;
    rkey: string;
    validate?: boolean;
    record: {};
    [k: string]: unknown;
}
export interface OutputSchema {
    uri: string;
    cid: string;
    [k: string]: unknown;
}
export interface CallOptions {
    headers?: Headers;
    qp?: QueryParams;
    encoding: 'application/json';
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
