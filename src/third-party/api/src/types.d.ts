import { AdxRecordValidator, AdxRecordValidatorDescription } from '@adxp/schemas';
import { GetRecordResponse } from './http-types.js';
export declare type SchemaOpt = string | string[] | AdxRecordValidator | AdxRecordValidatorDescription | '*';
export interface AdxClientOpts {
    pds?: string;
    locale?: string;
    schemas?: any[];
}
export interface RegisterRepoParams {
    did: string;
    username: string;
}
export interface GetRecordResponseValidated extends GetRecordResponse {
    valid?: boolean;
    fullySupported?: boolean;
    compatible?: boolean;
    error?: string | undefined;
    fallbacks?: string[] | undefined;
}
export interface ListRecordsResponseValidated {
    records: GetRecordResponseValidated[];
}
export interface BatchWrite {
    action: 'create' | 'put' | 'del';
    collection: string;
    key?: string;
    value?: any;
}
