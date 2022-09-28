import { Headers } from '@adxp/xrpc';
export interface QueryParams {
    did: string;
    type: string;
    tid: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface Response {
    success: boolean;
    headers: Headers;
}
export declare function toKnownErr(e: any): any;
