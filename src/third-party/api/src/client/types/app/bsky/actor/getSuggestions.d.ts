import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    limit?: number;
    cursor?: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    cursor?: string;
    actors: {
        did: string;
        handle: string;
        actorType: string;
        displayName?: string;
        description?: string;
        indexedAt?: string;
        myState?: {
            follow?: string;
        };
    }[];
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
