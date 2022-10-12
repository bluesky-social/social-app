import { Headers } from '@adxp/xrpc';
export interface QueryParams {
    did: string;
    from?: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface Response {
    success: boolean;
    headers: Headers;
    data: Uint8Array;
}
export declare function toKnownErr(e: any): any;
