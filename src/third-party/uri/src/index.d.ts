export declare const ADX_URI_REGEX: RegExp;
export declare class AdxUri {
    hash: string;
    host: string;
    pathname: string;
    searchParams: URLSearchParams;
    constructor(uri: string, base?: string);
    get protocol(): string;
    get origin(): string;
    get hostname(): string;
    set hostname(v: string);
    get search(): string;
    set search(v: string);
    get collection(): string;
    set collection(v: string);
    get recordKey(): string;
    set recordKey(v: string);
    get href(): string;
    toString(): string;
}
