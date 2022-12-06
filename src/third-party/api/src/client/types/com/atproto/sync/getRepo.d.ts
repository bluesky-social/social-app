import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    did: string;
    from?: string;
}
export declare type InputSchema = undefined;
export interface CallOptions {
    headers?: Headers;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: Uint8Array;
}
export declare function toKnownErr(e: any): any;
