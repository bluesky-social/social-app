import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    uri: string;
    cid?: string;
    limit?: number;
    before?: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    uri: string;
    cid?: string;
    cursor?: string;
    repostedBy: {
        did: string;
        name: string;
        displayName?: string;
        createdAt?: string;
        indexedAt: string;
    }[];
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
