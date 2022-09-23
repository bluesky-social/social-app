import { Headers } from '@adxp/xrpc';
export interface QueryParams {
    did: string;
    type: string;
    tid: string;
    validate?: boolean;
}
export interface CallOptions {
    headers?: Headers;
    encoding: 'application/json';
    data: InputSchema;
}
export interface InputSchema {
    [k: string]: unknown;
}
export interface OutputSchema {
    uri: string;
}
export interface Response {
    success: boolean;
    error: boolean;
    headers: Headers;
    data: OutputSchema;
}
