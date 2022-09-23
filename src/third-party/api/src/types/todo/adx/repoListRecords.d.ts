import { Headers } from '@adxp/xrpc';
export interface QueryParams {
    nameOrDid: string;
    type: string;
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
    records: {
        uri: string;
        value: {};
    }[];
}
export interface Response {
    success: boolean;
    error: boolean;
    headers: Headers;
    data: OutputSchema;
}
