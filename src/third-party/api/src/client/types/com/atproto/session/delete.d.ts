import { Headers } from '@atproto/xrpc';
export interface QueryParams {
}
export declare type InputSchema = undefined;
export interface CallOptions {
    headers?: Headers;
    qp?: QueryParams;
}
export interface Response {
    success: boolean;
    headers: Headers;
}
export declare function toKnownErr(e: any): any;
