import * as AppBskySystemDeclRef from '../system/declRef';
export interface Main {
    did: string;
    declarationCid: string;
    [k: string]: unknown;
}
export interface WithInfo {
    did: string;
    declaration: AppBskySystemDeclRef.Main;
    handle: string;
    displayName?: string;
    avatar?: string;
    [k: string]: unknown;
}
