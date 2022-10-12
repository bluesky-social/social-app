import { Headers } from '@adxp/xrpc';
export interface QueryParams {
    nameOrDid: string;
    type: string;
    tid: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    uri: string;
    value: {};
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
