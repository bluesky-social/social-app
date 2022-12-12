import { Headers, XRPCError } from '@atproto/xrpc';
export interface QueryParams {
}
export interface InputSchema {
    did?: string;
    displayName?: string;
    description?: string;
    avatar?: {
        cid: string;
        mimeType: string;
        [k: string]: unknown;
    };
    banner?: {
        cid: string;
        mimeType: string;
        [k: string]: unknown;
    };
    [k: string]: unknown;
}
export interface OutputSchema {
    uri: string;
    cid: string;
    record: {};
    [k: string]: unknown;
}
export interface CallOptions {
    headers?: Headers;
    qp?: QueryParams;
    encoding: 'application/json';
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare class InvalidBlobError extends XRPCError {
    constructor(src: XRPCError);
}
export declare class BlobTooLargeError extends XRPCError {
    constructor(src: XRPCError);
}
export declare class InvalidMimeTypeError extends XRPCError {
    constructor(src: XRPCError);
}
export declare class InvalidImageDimensionsError extends XRPCError {
    constructor(src: XRPCError);
}
export declare function toKnownErr(e: any): any;
