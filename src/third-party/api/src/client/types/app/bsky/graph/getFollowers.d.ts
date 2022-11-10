import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    user: string;
    limit?: number;
    before?: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export declare type ActorKnown = 'app.bsky.system.actorUser' | 'app.bsky.system.actorScene';
export declare type ActorUnknown = string;
export interface OutputSchema {
    subject: {
        did: string;
        declaration: Declaration;
        handle: string;
        displayName?: string;
    };
    cursor?: string;
    followers: {
        did: string;
        declaration: Declaration;
        handle: string;
        displayName?: string;
        createdAt?: string;
        indexedAt: string;
    }[];
}
export interface Declaration {
    cid: string;
    actorType: ActorKnown | ActorUnknown;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
