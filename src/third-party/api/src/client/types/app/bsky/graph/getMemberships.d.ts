import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    actor: string;
    limit?: number;
    before?: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    subject: {
        did: string;
        handle: string;
        displayName?: string;
    };
    cursor?: string;
    memberships: {
        did: string;
        handle: string;
        displayName?: string;
        declaration: {
            cid: string;
            actorType: string;
        };
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
