import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    user: string;
    collection: string;
    limit?: number;
    before?: string;
    after?: string;
    reverse?: boolean;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    cursor?: string;
    records: Record[];
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
export interface Record {
    uri: string;
    cid: string;
    value: {};
    [k: string]: unknown;
}
