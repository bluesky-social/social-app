import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    uri: string;
    cid?: string;
    direction?: 'up' | 'down';
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
    uri: string;
    cid?: string;
    cursor?: string;
    votes: {
        direction: 'up' | 'down';
        indexedAt: string;
        createdAt: string;
        actor: Actor;
    }[];
}
export interface Actor {
    did: string;
    declaration: Declaration;
    handle: string;
    displayName?: string;
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
