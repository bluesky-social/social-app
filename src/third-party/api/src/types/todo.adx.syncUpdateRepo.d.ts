import { Headers } from '@adxp/xrpc';
export interface QueryParams {
    did: string;
}
export interface CallOptions {
    headers?: Headers;
    encoding: 'application/cbor';
    data: Uint8Array;
}
export interface Response {
    success: boolean;
    error: boolean;
    headers: Headers;
}
