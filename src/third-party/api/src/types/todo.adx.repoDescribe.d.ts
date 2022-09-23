import { Headers } from '@adxp/xrpc';
export interface QueryParams {
    nameOrDid: string;
}
export interface CallOptions {
    headers?: Headers;
}
export interface OutputSchema {
    name: string;
    did: string;
    didDoc: {};
    collections: string[];
    nameIsCorrect: boolean;
}
export interface Response {
    success: boolean;
    error: boolean;
    headers: Headers;
    data: OutputSchema;
}
