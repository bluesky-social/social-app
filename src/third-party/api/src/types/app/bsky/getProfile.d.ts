import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    user: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    did: string;
    name: string;
    displayName?: string;
    description?: string;
    followersCount: number;
    followsCount: number;
    postsCount: number;
    pinnedBadges: Badge[];
    myState?: {
        follow?: string;
    };
}
export interface Badge {
    uri: string;
    cid: string;
    error?: string;
    issuer?: {
        did: string;
        name: string;
        displayName?: string;
    };
    assertion?: {
        type: string;
        tag?: string;
    };
    createdAt?: string;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
