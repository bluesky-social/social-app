import { Headers, XRPCError } from '@adxp/xrpc';
export interface QueryParams {
}
export interface CallOptions {
    headers?: Headers;
    encoding: 'application/json';
}
export interface InputSchema {
    email: string;
    username: string;
    inviteCode?: string;
    password: string;
}
export interface OutputSchema {
    jwt: string;
    username: string;
    did: string;
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
export declare class InvalidInviteCodeError extends XRPCError {
    constructor(src: XRPCError);
}
export declare class UsernameNotAvailableError extends XRPCError {
    constructor(src: XRPCError);
}
export declare function toKnownErr(e: any): any;
