import { Headers } from '@atproto/xrpc';
import * as AppBskyActorRef from '../actor/ref';
export interface QueryParams {
    uri: string;
    cid?: string;
    direction?: 'up' | 'down';
    limit?: number;
    before?: string;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    uri: string;
    cid?: string;
    cursor?: string;
    votes: Vote[];
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
export interface Vote {
    direction: 'up' | 'down';
    indexedAt: string;
    createdAt: string;
    actor: AppBskyActorRef.WithInfo;
    [k: string]: unknown;
}
