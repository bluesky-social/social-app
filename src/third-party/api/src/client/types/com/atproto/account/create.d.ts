import { Headers, XRPCError } from '@atproto/xrpc';
export interface QueryParams {
}
export interface InputSchema {
    email: string;
    handle: string;
    inviteCode?: string;
    password: string;
    recoveryKey?: string;
    [k: string]: unknown;
}
export interface OutputSchema {
    accessJwt: string;
    refreshJwt: string;
    handle: string;
    did: string;
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
export declare class InvalidPasswordError extends XRPCError {
    constructor(src: XRPCError);
}
export declare class InvalidInviteCodeError extends XRPCError {
    constructor(src: XRPCError);
}
export declare class HandleNotAvailableError extends XRPCError {
    constructor(src: XRPCError);
}
export declare function toKnownErr(e: any): any;
