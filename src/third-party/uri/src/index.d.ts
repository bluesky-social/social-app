export declare const ATP_URI_REGEX: RegExp;
export declare class AtUri {
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
    get rkey(): string;
    set rkey(v: string);
    get href(): string;
    toString(): string;
}
