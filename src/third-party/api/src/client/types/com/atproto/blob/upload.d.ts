import { Headers, XRPCError } from '@atproto/xrpc';
export interface QueryParams {
}
export declare type InputSchema = string | Uint8Array;
export interface OutputSchema {
    cid: string;
    [k: string]: unknown;
}
export interface CallOptions {
    headers?: Headers;
    qp?: QueryParams;
    encoding: '*/*';
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare class InvalidBlobError extends XRPCError {
    constructor(src: XRPCError);
}
export declare function toKnownErr(e: any): any;
