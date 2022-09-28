import { Headers, XRPCError } from '@adxp/xrpc';
export interface QueryParams {
}
export interface CallOptions {
    headers?: Headers;
    encoding: 'application/json';
}
export interface InputSchema {
    username: string;
    did: string;
    password: string;
}
export interface OutputSchema {
    jwt: string;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare class InvalidUsernameError extends XRPCError {
    constructor(src: XRPCError);
}
export declare class InvalidPasswordError extends XRPCError {
    constructor(src: XRPCError);
}
export declare class UsernameNotAvailableError extends XRPCError {
    constructor(src: XRPCError);
}
export declare function toKnownErr(e: any): any;
