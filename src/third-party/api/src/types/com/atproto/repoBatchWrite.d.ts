import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    did: string;
    validate?: boolean;
}
export interface CallOptions {
    headers?: Headers;
    encoding: 'application/json';
}
export interface InputSchema {
    writes: ({
        action: 'create';
        collection: string;
        rkey?: string;
        value: unknown;
    } | {
        action: 'update';
        collection: string;
        rkey: string;
        value: unknown;
    } | {
        action: 'delete';
        collection: string;
        rkey: string;
    })[];
}
export interface OutputSchema {
    [k: string]: unknown;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
