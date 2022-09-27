import { Headers } from '@adxp/xrpc';
export interface QueryParams {
}
export interface CallOptions {
    headers?: Headers;
    encoding: 'application/json';
}
export interface InputSchema {
    username: string;
    password: string;
}
export interface OutputSchema {
    jwt: string;
}
export interface Response {
    success: boolean;
    error: boolean;
    headers: Headers;
    data: OutputSchema;
}
