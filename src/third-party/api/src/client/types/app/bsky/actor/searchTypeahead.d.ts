import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    term: string;
    limit?: number;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    users: {
        did: string;
        handle: string;
        displayName?: string;
    }[];
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
