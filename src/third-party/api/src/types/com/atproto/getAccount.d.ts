import { Headers } from '@adxp/xrpc';
export interface QueryParams {
}
export interface CallOptions {
    headers?: Headers;
    encoding: '';
}
export interface InputSchema {
    [k: string]: unknown;
}
export interface OutputSchema {
    [k: string]: unknown;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
