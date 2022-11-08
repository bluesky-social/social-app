import { Headers, XRPCError } from '@atproto/xrpc';
export interface QueryParams {
}
export interface CallOptions {
    headers?: Headers;
    qp?: QueryParams;
    encoding: 'application/json';
}
export interface InputSchema {
    handle: string;
    recoveryKey?: string;
}
export interface OutputSchema {
    handle: string;
    did: string;
    declarationCid: string;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare class InvalidHandleError extends XRPCError {
    constructor(src: XRPCError);
}
export declare class HandleNotAvailableError extends XRPCError {
    constructor(src: XRPCError);
}
export declare function toKnownErr(e: any): any;
