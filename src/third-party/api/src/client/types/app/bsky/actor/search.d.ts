import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    term: string;
    limit?: number;
    before?: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    cursor?: string;
    users: {
        did: string;
        handle: string;
        displayName?: string;
        description?: string;
        indexedAt?: string;
    }[];
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
