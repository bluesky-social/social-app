import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    actor: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export declare type ActorKnown = 'app.bsky.system.actorUser' | 'app.bsky.system.actorScene';
export declare type ActorUnknown = string;
export interface OutputSchema {
    did: string;
    declaration: Declaration;
    handle: string;
    creator: string;
    displayName?: string;
    description?: string;
    followersCount: number;
    followsCount: number;
    membersCount: number;
    postsCount: number;
    myState?: {
        follow?: string;
        member?: string;
    };
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
