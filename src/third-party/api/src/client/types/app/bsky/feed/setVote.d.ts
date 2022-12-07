import { Headers } from '@atproto/xrpc';
import * as ComAtprotoRepoStrongRef from '../../../com/atproto/repo/strongRef';
export interface QueryParams {
}
export interface InputSchema {
    subject: ComAtprotoRepoStrongRef.Main;
    direction: 'up' | 'down' | 'none';
    [k: string]: unknown;
}
export interface OutputSchema {
    upvote?: string;
    downvote?: string;
    [k: string]: unknown;
}
export interface CallOptions {
    headers?: Headers;
    qp?: QueryParams;
    encoding: 'application/json';
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
