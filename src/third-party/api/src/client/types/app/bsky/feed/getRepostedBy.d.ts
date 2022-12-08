import { Headers } from '@atproto/xrpc';
import * as AppBskySystemDeclRef from '../system/declRef';
export interface QueryParams {
    uri: string;
    cid?: string;
    limit?: number;
    before?: string;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    uri: string;
    cid?: string;
    cursor?: string;
    repostedBy: RepostedBy[];
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
export interface RepostedBy {
    did: string;
    declaration: AppBskySystemDeclRef.Main;
    handle: string;
    displayName?: string;
    avatar?: string;
    createdAt?: string;
    indexedAt: string;
    [k: string]: unknown;
}
