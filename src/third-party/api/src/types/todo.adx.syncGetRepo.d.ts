import { Headers } from '@adxp/xrpc';
export interface QueryParams {
    did: string;
    from?: string;
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
