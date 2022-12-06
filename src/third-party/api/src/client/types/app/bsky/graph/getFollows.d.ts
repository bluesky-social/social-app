import { Headers } from '@atproto/xrpc';
import * as AppBskyActorRef from '../actor/ref';
import * as AppBskySystemDeclRef from '../system/declRef';
export interface QueryParams {
    user: string;
    limit?: number;
    before?: string;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    subject: AppBskyActorRef.WithInfo;
    cursor?: string;
    follows: Follow[];
    [k: string]: unknown;
}
export interface CallOptions {
    headers?: Headers;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
export interface Follow {
    did: string;
    declaration: AppBskySystemDeclRef.Main;
    handle: string;
    displayName?: string;
    createdAt?: string;
    indexedAt: string;
    [k: string]: unknown;
}
