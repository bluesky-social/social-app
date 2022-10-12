import { Headers } from '@adxp/xrpc';
export interface QueryParams {
    uri: string;
    limit?: number;
    before?: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    uri: string;
    likedBy: {
        did: string;
        name: string;
        displayName?: string;
        createdAt?: string;
        indexedAt: string;
    }[];
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
