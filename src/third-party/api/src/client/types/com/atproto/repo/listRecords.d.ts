import { Headers } from '@atproto/xrpc';
export interface QueryParams {
    user: string;
    collection: string;
    limit?: number;
    before?: string;
    after?: string;
    reverse?: boolean;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    cursor?: string;
    records: {
        uri: string;
        cid: string;
        value: {};
    }[];
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
