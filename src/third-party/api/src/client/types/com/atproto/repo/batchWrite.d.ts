import { Headers } from '@atproto/xrpc';
export interface QueryParams {
}
export interface InputSchema {
    did: string;
    validate?: boolean;
    writes: (Create | Update | Delete)[];
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
}
export declare function toKnownErr(e: any): any;
export interface Create {
    action: 'create';
    collection: string;
    rkey?: string;
    value: {};
    [k: string]: unknown;
}
export interface Update {
    action: 'update';
    collection: string;
    rkey: string;
    value: {};
    [k: string]: unknown;
}
export interface Delete {
    action: 'delete';
    collection: string;
    rkey: string;
    [k: string]: unknown;
}
