import { Headers } from '@atproto/xrpc';
export interface QueryParams {
}
export interface CallOptions {
    headers?: Headers;
    qp?: QueryParams;
    encoding: 'application/json';
}
export interface InputSchema {
    subject: Subject;
    direction: 'up' | 'down' | 'none';
}
export interface Subject {
    uri: string;
    cid: string;
}
export interface OutputSchema {
    upvote?: string;
    downvote?: string;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
