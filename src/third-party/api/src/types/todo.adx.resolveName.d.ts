import { Headers } from '@adxp/xrpc';
export interface QueryParams {
    name: string;
}
export interface CallOptions {
    headers?: Headers;
}
export interface OutputSchema {
    did: string;
}
export interface Response {
    success: boolean;
    error: boolean;
    headers: Headers;
    data: OutputSchema;
}
