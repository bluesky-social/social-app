import { Headers } from '@atproto/xrpc';
export interface QueryParams {
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
    cursor?: string;
    notifications: Notification[];
}
export interface Notification {
    uri: string;
    cid: string;
    author: {
        did: string;
        declaration: Declaration;
        handle: string;
        displayName?: string;
    };
    reason: string;
    reasonSubject?: string;
    record: {};
    isRead: boolean;
    indexedAt: string;
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
