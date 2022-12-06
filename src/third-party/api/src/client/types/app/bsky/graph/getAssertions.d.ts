import { Headers } from '@atproto/xrpc';
import * as AppBskyActorRef from '../actor/ref';
export interface QueryParams {
    author?: string;
    subject?: string;
    assertion?: string;
    confirmed?: boolean;
    limit?: number;
    before?: string;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    cursor?: string;
    assertions: Assertion[];
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
export interface Assertion {
    uri: string;
    cid: string;
    assertion: string;
    confirmation?: Confirmation;
    author: AppBskyActorRef.WithInfo;
    subject: AppBskyActorRef.WithInfo;
    indexedAt: string;
    createdAt: string;
    [k: string]: unknown;
}
export interface Confirmation {
    uri: string;
    cid: string;
    indexedAt: string;
    createdAt: string;
    [k: string]: unknown;
}
