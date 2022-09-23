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
    error: boolean;
    headers: Headers;
    data: OutputSchema;
}
