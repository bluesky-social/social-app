import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    term: string;
    limit?: number;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export declare type ActorKnown = 'app.bsky.system.actorUser' | 'app.bsky.system.actorScene';
export declare type ActorUnknown = string;
export interface OutputSchema {
    users: {
        did: string;
        declaration: Declaration;
        handle: string;
        displayName?: string;
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
