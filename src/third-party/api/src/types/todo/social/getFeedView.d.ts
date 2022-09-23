import { Headers } from '@adxp/xrpc';
export interface QueryParams {
    author?: string;
    limit?: number;
    before?: string;
}
export interface CallOptions {
    headers?: Headers;
}
export interface Response {
    success: boolean;
    error: boolean;
    headers: Headers;
    data: Uint8Array;
}
