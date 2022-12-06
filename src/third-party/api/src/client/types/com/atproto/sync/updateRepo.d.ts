import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    did: string;
}
export declare type InputSchema = string | Uint8Array;
export interface CallOptions {
    headers?: Headers;
    qp?: QueryParams;
    encoding: 'application/cbor';
}
export interface Response {
    success: boolean;
    headers: Headers;
}
export declare function toKnownErr(e: any): any;
