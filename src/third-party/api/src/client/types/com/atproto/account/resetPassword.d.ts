import { Headers, XRPCError } from '@atproto/xrpc';
export interface QueryParams {
}
export interface CallOptions {
    headers?: Headers;
    qp?: QueryParams;
    encoding: 'application/json';
}
export interface InputSchema {
    token: string;
    password: string;
}
export interface OutputSchema {
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare class ExpiredTokenError extends XRPCError {
    constructor(src: XRPCError);
}
export declare class InvalidTokenError extends XRPCError {
    constructor(src: XRPCError);
}
export declare function toKnownErr(e: any): any;
