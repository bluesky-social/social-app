import { Headers } from '@adxp/xrpc';
export interface QueryParams {
    did: string;
}
export interface CallOptions {
    headers?: Headers;
    encoding: 'application/cbor';
}
export declare type InputSchema = string | Uint8Array;
export interface Response {
    success: boolean;
    headers: Headers;
}
export declare function toKnownErr(e: any): any;
