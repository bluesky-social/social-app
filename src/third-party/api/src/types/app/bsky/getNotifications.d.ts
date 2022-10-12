import { Headers } from '@adxp/xrpc';
export interface QueryParams {
    limit?: number;
    before?: string;
}
export interface CallOptions {
    headers?: Headers;
}
export declare type InputSchema = undefined;
export interface OutputSchema {
    notifications: Notification[];
}
export interface Notification {
    uri: string;
    author: {
        did: string;
        name: string;
        displayName?: string;
    };
    reason: string;
    reasonSubject?: string;
    record: {};
    isRead: boolean;
    indexedAt: string;
}
export interface Response {
    success: boolean;
    headers: Headers;
    data: OutputSchema;
}
export declare function toKnownErr(e: any): any;
