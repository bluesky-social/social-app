import { Headers } from '@adxp/xrpc';
export interface QueryParams {
}
export interface CallOptions {
    headers?: Headers;
    encoding: '';
    data: InputSchema;
}
export interface InputSchema {
    [k: string]: unknown;
}
export interface OutputSchema {
    [k: string]: unknown;
}
export interface Response {
    success: boolean;
    error: boolean;
    headers: Headers;
    data: OutputSchema;
}
