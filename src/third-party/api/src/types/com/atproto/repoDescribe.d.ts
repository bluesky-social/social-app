import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    user: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    name: string;
    did: string;
    didDoc: {};
    collections: string[];
    nameIsCorrect: boolean;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
