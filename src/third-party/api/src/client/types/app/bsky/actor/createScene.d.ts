import { Headers, XRPCError } from '@atproto/xrpc';
import * as AppBskySystemDeclRef from '../system/declRef';
export interface QueryParams {
}
export interface InputSchema {
    handle: string;
    recoveryKey?: string;
    [k: string]: unknown;
}
export interface OutputSchema {
    handle: string;
    did: string;
    declaration: AppBskySystemDeclRef.Main;
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
export declare class InvalidHandleError extends XRPCError {
    constructor(src: XRPCError);
}
export declare class HandleNotAvailableError extends XRPCError {
    constructor(src: XRPCError);
}
export declare function toKnownErr(e: any): any;
