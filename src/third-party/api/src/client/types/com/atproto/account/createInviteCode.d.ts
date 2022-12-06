import { Headers } from '@atproto/xrpc';
export interface QueryParams {
}
export interface InputSchema {
    useCount: number;
    [k: string]: unknown;
}
export interface OutputSchema {
    code: string;
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
export declare function toKnownErr(e: any): any;
